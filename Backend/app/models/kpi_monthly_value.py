"""KPI Monthly Value - one row per (indicator, year, month). NOT a
January/February/... column per month, per spec.

`month` is stored as an integer 1-12 (Jan=1) for clean ordering and a
simple unique constraint; the schema layer maps this to the 3-letter
labels the frontend uses (Jan, Feb, ...) - see app/schemas/kpi.py:MONTHS.

`year` was added before this table was ever created (see the migration -
it's folded into the initial create_table, not a follow-up ALTER), so
"Jan 2025" and "Jan 2026" are separate rows instead of one row that gets
overwritten every year. Every read/write path (KpiRepository, KpiService,
the /kpis routes) takes an explicit `year`, defaulting to the current
calendar year when the caller doesn't specify one.

`percentage` is always server-computed as (actual / target) * 100 - the
frontend must never calculate it itself. See app/services/kpi_service.py.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, SmallInteger, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.types import GUID


class KpiMonthlyValue(Base):
    __tablename__ = "kpi_monthly_values"
    __table_args__ = (
        UniqueConstraint("indicator_id", "year", "month", name="uq_monthly_value_indicator_year_month"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    indicator_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("kpi_indicators.id", ondelete="CASCADE"), nullable=False, index=True
    )

    year: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    month: Mapped[int] = mapped_column(SmallInteger, nullable=False)  # 1=Jan ... 12=Dec

    actual_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    target_value: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)
    percentage: Mapped[Decimal | None] = mapped_column(Numeric(6, 2), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    indicator: Mapped["KpiIndicator"] = relationship("KpiIndicator", back_populates="monthly_values")