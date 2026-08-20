"""Import History - one row per KPI spreadsheet upload attempt, success
or failure. Created for every upload that actually reaches row-processing
(structural rejections like a wrong file extension never get this far -
see ImportService.process_import).

`uploaded_by_id` uses ondelete=SET NULL (like AuditLog.user_id) so a
deleted user account doesn't cascade-delete their import history.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.types import GUID


class ImportHistory(Base):
    __tablename__ = "import_history"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)

    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True
    )
    uploaded_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), index=True
    )

    total_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    imported_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    failed_rows: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    # SUCCESS | PARTIAL_SUCCESS | FAILED - see ImportService._resolve_status.
    # Plain string, not a native DB enum - same rationale as
    # KpiIndicator.target_type: cross-db portable, validated at the
    # Pydantic layer (see app/schemas/imports.py:ImportStatus).
    status: Mapped[str] = mapped_column(String(20), nullable=False, index=True)

    duration_ms: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    # Newline-joined, capped summary of row-level errors - not a full
    # per-row audit trail (that would belong in its own table if ever
    # needed at scale); enough to show "what went wrong" on the history
    # page without unbounded storage growth.
    error_summary: Mapped[str | None] = mapped_column(Text, nullable=True)

    uploaded_by: Mapped["User"] = relationship("User")