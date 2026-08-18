"""KPI Indicator - third level of the hierarchy, belongs to a Parameter.
Each row represents one trackable KPI (e.g. "Electricity uptime days/month").
Monthly actual/target values live in KpiMonthlyValue, one row per month -
see that model's docstring for why there are no January/February/...
columns here.
"""
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Numeric, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.types import GUID


class KpiIndicator(Base):
    __tablename__ = "kpi_indicators"
    __table_args__ = (
        UniqueConstraint("parameter_id", "indicator_name", name="uq_indicator_parameter_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    parameter_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("parameters.id", ondelete="CASCADE"), nullable=False, index=True
    )

    indicator_name: Mapped[str] = mapped_column(String(255), nullable=False)
    # Nullable: some real-world sheet rows have no clean numeric Annual
    # Target (blank, or annotated text like Mentorship's
    # "20(1.HY) \n20+14(2.HY)" where only a partial number could be
    # extracted with confidence) - see kpi_import_validator's
    # _extract_first_number. An indicator with no Annual Target is still
    # valid; it just can't contribute to annual-progress percentage
    # calculations downstream (those already guard on this being present).
    annual_target: Mapped[Decimal | None] = mapped_column(Numeric(14, 2), nullable=True)

    # Stored as plain strings (not a native DB enum) for cross-db portability
    # and consistency with User.theme_preference - validity is enforced at
    # the Pydantic schema layer (Literal types), same pattern used there.
    target_type: Mapped[str] = mapped_column(String(20), nullable=False, default="MONTHLY")
    measurement_unit: Mapped[str] = mapped_column(String(20), nullable=False, default="COUNT")

    # ASSUMPTION: not in the original field list, but both KpiEntry.tsx and
    # KpiUpdate.tsx display/edit a "Person Responsible" per indicator -
    # added as a plain string rather than dropping that UI column. Not a
    # user_id FK; revisit if you want it to reference a real account.
    person_in_charge: Mapped[str | None] = mapped_column(String(255), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    parameter: Mapped["Parameter"] = relationship("Parameter", back_populates="indicators")
    monthly_values: Mapped[list["KpiMonthlyValue"]] = relationship(
        "KpiMonthlyValue",
        back_populates="indicator",
        cascade="all, delete-orphan",
        order_by="KpiMonthlyValue.month",
    )