"""Import module schemas."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ImportStatus = Literal["SUCCESS", "PARTIAL_SUCCESS", "FAILED"]

# Exact column names expected in the uploaded spreadsheet, in the order
# the "Expected Columns" section on the frontend should display them.
EXPECTED_COLUMNS: list[str] = [
    "Department",
    "Parameter",
    "Indicator",
    "Person Responsible",
    "Annual Target",
    "Target Type",
    "Measurement Unit",
    "Year",
    "Month",
    "Actual Value",
    "Target Value",
]


class ExpectedColumnsOut(BaseModel):
    required_columns: list[str] = EXPECTED_COLUMNS


class RowError(BaseModel):
    """One row-level problem found during cleaning/validation. `row_number`
    is 1-indexed against the spreadsheet's data rows (header excluded) so
    it matches what a user sees when they open the file in Excel (header
    is row 1, so data row 1 is spreadsheet row 2 - see the validator)."""
    row_number: int
    column: str | None = None
    message: str


class ImportHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    uploaded_by: str | None = None  # resolved to the uploader's full_name - see ImportService._to_history_out
    uploaded_by_email: str | None = None
    uploaded_at: datetime
    total_rows: int
    imported_rows: int
    failed_rows: int
    status: ImportStatus
    duration_ms: int
    file_size_bytes: int
    error_summary: str | None = None


class ImportResultOut(BaseModel):
    """Response body for POST /imports - the persisted history record plus
    the detailed per-row errors (empty on a clean SUCCESS)."""
    history: ImportHistoryOut
    row_errors: list[RowError] = Field(default_factory=list)


class ImportHistoryListResponse(BaseModel):
    items: list[ImportHistoryOut]
    total: int
    page: int
    page_size: int


class ImportSummaryOut(BaseModel):
    """Backs the Import Data / Import History dashboard cards."""
    last_7_days_successful_imports: int
    recent_failed_imports: int  # ASSUMPTION: also scoped to the last 7 days - see chat note
    total_rows_processed: int  # all-time, across every import ever run