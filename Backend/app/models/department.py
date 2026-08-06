"""Department - top level of the KPI hierarchy:
Department -> Parameter -> KPI Indicator -> Monthly Value.

Not scoped to a single user - any authenticated user can create/see/edit
KPI data (see app/api/v1/kpis/routes.py), matching how KpiEntry.tsx and
KpiUpdate.tsx don't gate by role today.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base
from app.utils.types import GUID


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(150), nullable=False, unique=True, index=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    parameters: Mapped[list["Parameter"]] = relationship(
        "Parameter", back_populates="department", cascade="all, delete-orphan"
    )