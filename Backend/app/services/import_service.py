"""Business logic for the Import module.

Percentage is recalculated here, never trusted from the spreadsheet - same
rule as KpiService. See _calculate_percentage.

Transaction model: this service's DB session is the same one the request's
get_db dependency will commit at the very end (or roll back on a fully
unexpected error). To satisfy "roll back everything if any unrecoverable
error occurs" for just the import batch - while still guaranteeing an
ImportHistory row gets written even on failure - the row-import loop runs
inside a SAVEPOINT (db.begin_nested()). If something blows up mid-batch,
only the SAVEPOINT rolls back; the outer session is still healthy
afterward to record history and an audit log entry.
"""
import io
import logging
import time
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

import pandas as pd
from fastapi import UploadFile

from app.exceptions.custom_exceptions import (
    ImportColumnsMissingException,
    ImportFileTooLargeException,
    ImportHistoryNotFoundException,
    InvalidImportFileTypeException,
)
from app.models.import_history import ImportHistory
from app.models.kpi_monthly_value import KpiMonthlyValue
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.import_history_repository import ImportHistoryRepository
from app.repositories.kpi_repository import KpiRepository
from app.services.kpi_service import current_year as _current_year
from app.schemas.imports import EXPECTED_COLUMNS, ImportHistoryOut, ImportResultOut, ImportSummaryOut, RowError
from app.validators.kpi_import_validator import (
    MAX_FILE_SIZE_BYTES,
    clean_and_validate,
    clean_and_validate_wide,
    detect_format,
    normalize_columns,
)
from sqlalchemy.ext.asyncio import AsyncSession

logger = logging.getLogger("groundpulse")

_MAX_ERROR_SUMMARY_CHARS = 5000


class ImportService:
    def __init__(self, db: AsyncSession, actor: User, ip_address: str | None = None, user_agent: str | None = None):
        self.db = db
        self.actor = actor
        self.kpi_repo = KpiRepository(db)
        self.history_repo = ImportHistoryRepository(db)
        self.audit = AuditLogRepository(db)
        self.ip_address = ip_address
        self.user_agent = user_agent
        # Per-import caches. A typical sheet re-references the same
        # department/parameter/indicator across many rows (12 months per
        # indicator, several indicators per department) - without these,
        # _import_row was re-querying the DB for the same names on every
        # single row. Scoped to one process_import() call, not shared
        # across requests - reset at the start of each import (see below).
        self._department_cache: dict[str, "Department"] = {}
        self._parameter_cache: dict[tuple[str, str], "Parameter"] = {}
        self._indicator_cache: dict[tuple[str, str, str], "KpiIndicator"] = {}

    # ---------------------------------------------------------------- #
    # Upload
    # ---------------------------------------------------------------- #

    async def process_import(self, file: UploadFile, year: int | None = None) -> ImportResultOut:
        """`year` only matters for wide-format sheets (see
        kpi_import_validator.detect_format) - the long format carries its
        own Year column per row and this parameter is ignored for it.
        Defaults to the current calendar year when omitted."""
        started_at = time.perf_counter()
        self._department_cache = {}
        self._parameter_cache = {}
        self._indicator_cache = {}

        self._validate_file_type(file)
        contents = await file.read()
        self._validate_file_size(contents)

        # Read the file exactly once - reused for every row below.
        df = self._read_dataframe(file, contents)

        file_format = detect_format(df)
        if file_format == "long":
            df, missing_columns = normalize_columns(df)
            if missing_columns:
                self.audit.add(
                    "KPI_IMPORT_UPLOAD_FAILED", user_id=self.actor.id,
                    description=f"Rejected '{file.filename}': missing columns {missing_columns}",
                    ip_address=self.ip_address, user_agent=self.user_agent,
                )
                logger.warning("Import rejected filename=%s missing_columns=%s", file.filename, missing_columns)
                raise ImportColumnsMissingException(missing_columns)
            cleaning = clean_and_validate(df)
        elif file_format == "wide":
            resolved_year = year if year is not None else _current_year()
            cleaning = clean_and_validate_wide(df, resolved_year)
        else:
            self.audit.add(
                "KPI_IMPORT_UPLOAD_FAILED", user_id=self.actor.id,
                description=f"Rejected '{file.filename}': unrecognized spreadsheet layout",
                ip_address=self.ip_address, user_agent=self.user_agent,
            )
            logger.warning("Import rejected filename=%s: unrecognized layout", file.filename)
            raise ImportColumnsMissingException(EXPECTED_COLUMNS)

        total_rows = len(cleaning.rows) + len(cleaning.errors)

        imported_rows = 0
        row_errors: list[RowError] = list(cleaning.errors)

        if cleaning.rows:
            try:
                async with self.db.begin_nested():
                    for row in cleaning.rows:
                        await self._import_row(row)
                        imported_rows += 1
            except Exception as exc:
                # SAVEPOINT rolled back automatically on exception exit -
                # every row in this batch is undone, imported_rows resets,
                # and everything not yet imported is reported as failed.
                logger.error("Import batch failed filename=%s: %s", file.filename, exc, exc_info=True)
                imported_rows = 0
                row_errors = row_errors + [
                    RowError(row_number=row.row_number, message="Not imported - batch was rolled back due to an unexpected error.")
                    for row in cleaning.rows
                ]

        duration_ms = int((time.perf_counter() - started_at) * 1000)
        status = self._resolve_status(total_rows, imported_rows, len(row_errors))

        history = ImportHistory(
            filename=file.filename or "unknown.xlsx",
            uploaded_by_id=self.actor.id,
            total_rows=total_rows,
            imported_rows=imported_rows,
            failed_rows=len(row_errors),
            status=status,
            duration_ms=duration_ms,
            file_size_bytes=len(contents),
            error_summary=self._build_error_summary(row_errors),
        )
        # Assign directly rather than relying on a lazy load of
        # history.uploaded_by right below - async SQLAlchemy has no
        # implicit lazy loading, and this object was just created in this
        # same session (not re-fetched with selectinload like the
        # repository's read paths do).
        history.uploaded_by = self.actor
        self.history_repo.add(history)
        await self.history_repo.flush()

        self.audit.add(
            "KPI_IMPORT_COMPLETED" if status != "FAILED" else "KPI_IMPORT_FAILED",
            user_id=self.actor.id,
            description=f"Imported '{file.filename}': {imported_rows}/{total_rows} rows, status={status}",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )
        logger.info(
            "Import finished filename=%s status=%s imported=%d/%d duration_ms=%d",
            file.filename, status, imported_rows, total_rows, duration_ms,
        )

        return ImportResultOut(history=self._to_history_out(history), row_errors=row_errors)

    async def _import_row(self, row) -> None:
        department = self._department_cache.get(row.department)
        if department is None:
            department = await self.kpi_repo.get_or_create_department(row.department)
            self._department_cache[row.department] = department

        parameter_key = (row.department, row.parameter)
        parameter = self._parameter_cache.get(parameter_key)
        if parameter is None:
            parameter = await self.kpi_repo.get_or_create_parameter(department.id, row.parameter)
            self._parameter_cache[parameter_key] = parameter

        indicator_key = (row.department, row.parameter, row.indicator_name)
        indicator = self._indicator_cache.get(indicator_key)
        if indicator is None:
            indicator, _created = await self.kpi_repo.get_or_create_indicator(
                parameter_id=parameter.id,
                indicator_name=row.indicator_name,
                annual_target=Decimal(str(row.annual_target)),
                target_type=row.target_type,
                measurement_unit=row.measurement_unit,
                person_in_charge=row.person_in_charge,
            )
            self._indicator_cache[indicator_key] = indicator

        actual = Decimal(str(row.actual_value)) if row.actual_value is not None else None
        # No auto-fill, same rule as KpiService.update_month: a month's
        # target is whatever the spreadsheet actually gave for it, or
        # None if it didn't. annual_target / 12 used to be the fallback
        # here regardless of target_type, which fabricated a nonsense
        # "monthly" target for QUARTERLY/BIANNUAL/YEARLY indicators (a
        # biannual 5,000 lump sum smeared as ~417/month on every blank
        # month). Trust the sheet's blanks - they mean "no target this
        # month", not "guess one for me".
        target = Decimal(str(row.target_value)) if row.target_value is not None else None

        # This SELECT is still one round trip per row - it's checking
        # whether THIS row's (indicator, year, month) already has data
        # from a previous import, which genuinely can't be known from
        # the in-memory caches above. Everything else in this function
        # is now cache-hit for any indicator already seen earlier in
        # this same file.
        monthly_value = await self.kpi_repo.get_monthly_value(indicator.id, row.year, row.month)
        if monthly_value is None:
            monthly_value = KpiMonthlyValue(
                indicator_id=indicator.id, year=row.year, month=row.month,
                actual_value=actual, target_value=target,
            )
            self.kpi_repo.add_monthly_value(monthly_value)
        else:
            # Only overwrite a field when this row actually provides a
            # value for it - a blank cell means "no update", not "clear
            # it". Otherwise a partial re-import (e.g. just Jan-June)
            # would wipe out July-Dec data entered another way.
            if actual is not None:
                monthly_value.actual_value = actual
            if target is not None:
                monthly_value.target_value = target

        monthly_value.percentage = self._calculate_percentage(monthly_value.actual_value, monthly_value.target_value)
        # No flush here. The old per-row flush() was the biggest cost in
        # a large import: with this backend's per-request latency (see
        # the chat note on expected-columns taking 1.5s with zero DB
        # work), that's ~1.5s added to every single row on top of the
        # lookups above. IDs used as FKs (department.id, parameter.id,
        # indicator.id) are already available in memory the moment each
        # object is constructed - default=uuid.uuid4 generates them
        # client-side, so nothing downstream needs a flush to "see" them.
        # SQLAlchemy's unit-of-work sorts the eventual INSERTs by FK
        # dependency automatically. Everything added in this loop is
        # flushed together as part of the request's final commit.

    # ---------------------------------------------------------------- #
    # History
    # ---------------------------------------------------------------- #

    async def list_history(
        self, page: int, page_size: int, search: str | None, status_filter: str | None
    ) -> tuple[list[ImportHistoryOut], int]:
        items, total = await self.history_repo.list_history(page, page_size, search, status_filter)
        return [self._to_history_out(item) for item in items], total

    async def get_history(self, history_id: uuid.UUID) -> ImportHistoryOut:
        record = await self.history_repo.get_by_id(history_id)
        if record is None:
            raise ImportHistoryNotFoundException()
        return self._to_history_out(record)

    async def delete_history(self, history_id: uuid.UUID) -> None:
        record = await self.history_repo.get_by_id(history_id)
        if record is None:
            raise ImportHistoryNotFoundException()

        self.audit.add(
            "KPI_IMPORT_HISTORY_DELETED", user_id=self.actor.id,
            description=f"Deleted import history for '{record.filename}'",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )
        logger.info("Import history deleted id=%s by=%s", history_id, self.actor.id)

        await self.history_repo.delete(record)

    async def get_summary(self) -> ImportSummaryOut:
        since = datetime.now(timezone.utc) - timedelta(days=7)
        data = await self.history_repo.get_summary(since)
        return ImportSummaryOut(**data)

    # ---------------------------------------------------------------- #
    # Template / expected columns
    # ---------------------------------------------------------------- #

    def record_template_download(self) -> None:
        self.audit.add(
            "KPI_IMPORT_TEMPLATE_DOWNLOADED", user_id=self.actor.id,
            description="Downloaded the KPI import template",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )

    # ---------------------------------------------------------------- #
    # Internal helpers
    # ---------------------------------------------------------------- #

    @staticmethod
    def _validate_file_type(file: UploadFile) -> None:
        filename = (file.filename or "").lower()
        if not (filename.endswith(".xlsx") or filename.endswith(".csv")):
            raise InvalidImportFileTypeException()

    @staticmethod
    def _read_dataframe(file: UploadFile, contents: bytes) -> pd.DataFrame:
        filename = (file.filename or "").lower()
        if filename.endswith(".csv"):
            # CSV has no declared encoding, unlike .xlsx - try the common
            # case first (utf-8, including a BOM some tools add), then
            # fall back to latin-1, which never raises on arbitrary bytes,
            # so a mis-encoded file still gets a chance to validate/import
            # rather than failing on encoding alone.
            try:
                return pd.read_csv(io.BytesIO(contents), encoding="utf-8-sig")
            except UnicodeDecodeError:
                return pd.read_csv(io.BytesIO(contents), encoding="latin-1")
        return pd.read_excel(io.BytesIO(contents), engine="openpyxl")

    @staticmethod
    def _validate_file_size(contents: bytes) -> None:
        if len(contents) > MAX_FILE_SIZE_BYTES:
            raise ImportFileTooLargeException(max_mb=MAX_FILE_SIZE_BYTES // (1024 * 1024))

    @staticmethod
    def _resolve_status(total_rows: int, imported_rows: int, failed_rows: int) -> str:
        if total_rows == 0 or imported_rows == 0:
            return "FAILED"
        if failed_rows > 0:
            return "PARTIAL_SUCCESS"
        return "SUCCESS"

    @staticmethod
    def _calculate_percentage(actual: Decimal | None, target: Decimal | None) -> Decimal | None:
        """Same rule as KpiService._calculate_percentage - never trust the
        spreadsheet's own percentage, if it even has one (Percentage isn't
        even in EXPECTED_COLUMNS, so this always recomputes from scratch)."""
        if actual is None or target is None or target == 0:
            return None
        return round((actual / target) * Decimal(100), 2)

    @staticmethod
    def _build_error_summary(row_errors: list[RowError]) -> str | None:
        if not row_errors:
            return None
        lines = [f"Row {e.row_number}: {e.message}" for e in row_errors]
        summary = "\n".join(lines)
        if len(summary) > _MAX_ERROR_SUMMARY_CHARS:
            summary = summary[:_MAX_ERROR_SUMMARY_CHARS] + f"\n... ({len(lines)} total errors, truncated)"
        return summary

    @staticmethod
    def _to_history_out(record: ImportHistory) -> ImportHistoryOut:
        return ImportHistoryOut(
            id=record.id,
            filename=record.filename,
            uploaded_by=record.uploaded_by.full_name if record.uploaded_by else None,
            uploaded_by_email=record.uploaded_by.email if record.uploaded_by else None,
            uploaded_at=record.uploaded_at,
            total_rows=record.total_rows,
            imported_rows=record.imported_rows,
            failed_rows=record.failed_rows,
            status=record.status,
            duration_ms=record.duration_ms,
            file_size_bytes=record.file_size_bytes,
            error_summary=record.error_summary,
        )