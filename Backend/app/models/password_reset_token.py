"""Forgot-password reset flow — two-stage OTP.

Stage 1: a 6-digit numeric code is emailed and hashed here as `code_hash`.
Stage 2: once the code is verified, a separate high-entropy `reset_token`
(hashed as `reset_token_hash`) is issued — that's what the "Create New
Password" screen actually submits, not the raw code. Splitting it this way
means the 6-digit code (small keyspace, guessable) is never itself the
credential that authorizes a password change; guessing it just gets you
into a longer, effectively unguessable indirection.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.types import GUID


class PasswordResetToken(Base):
    __tablename__ = "password_reset_tokens"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )

    # --- Stage 1: the 6-digit code sent by email ---
    code_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    code_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    # --- Stage 2: issued only after the code above is successfully verified ---
    reset_token_hash: Mapped[str | None] = mapped_column(String(255), nullable=True, unique=True, index=True)
    reset_token_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    used: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )