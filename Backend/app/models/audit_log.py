"""Audit log - append-only trail of security-relevant events."""
import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.types import GUID


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)

    event_type: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # e.g. LOGIN_SUCCESS, LOGIN_FAILED, SIGNUP, LOGOUT, PASSWORD_CHANGED,
    #      PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED, GOOGLE_LOGIN,
    #      ACCOUNT_LOCKED, ROLE_CHANGED

    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    ip_address: Mapped[str | None] = mapped_column(String(64), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(500), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
