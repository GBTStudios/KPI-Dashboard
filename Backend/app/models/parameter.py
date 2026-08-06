"""Parameter - second level of the KPI hierarchy. Belongs to a Department;
name is unique per department (not globally) so e.g. "Website" could exist
under both Marketing and Programs without conflict."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.types import GUID


class Parameter(Base):
    __tablename__ = "parameters"
    __table_args__ = (
        UniqueConstraint("department_id", "name", name="uq_parameter_department_name"),
    )

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    department_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("departments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(150), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    department: Mapped["Department"] = relationship("Department", back_populates="parameters")
    indicators: Mapped[list["KpiIndicator"]] = relationship(
        "KpiIndicator", back_populates="parameter", cascade="all, delete-orphan"
    )