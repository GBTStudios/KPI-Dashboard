"""User model.

Supports two account "kinds" that coexist in one table:
  - email/password accounts (password_hash set, oauth_provider NULL)
  - Google accounts        (oauth_provider='google', password_hash may be NULL)

A user can also link Google to an existing email/password account (matched by
email) - see AuthService.google_auth for that logic.

ADMIN MODEL: there is exactly one administrator, seeded on startup from
settings.ADMIN_EMAIL/ADMIN_NAME/ADMIN_INITIAL_PASSWORD (see
app/services/admin_seed_service.py) and identified purely by email
comparison (app/dependencies/auth.py:require_admin). The `role` column
below is legacy/informational only - it is never consulted for
authorization anywhere in the app, and there is no role-promotion or
role-based permission system.

ADDED for User Management + Settings screens (see migration):
  - is_suspended / suspended_at / suspended_reason / suspended_by_id:
    an explicit admin action, separate from `is_active`. `is_active` still
    means "can this account authenticate at all" (used by get_current_user);
    `is_suspended` is the specific "an admin suspended this account" state
    shown as its own badge/stat on the User Management screen.
  - theme_preference / notifications_enabled: the two persisted toggles on
    the Settings screen.
"""
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base
from app.utils.types import GUID


class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)

    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), nullable=False, unique=True, index=True)

    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)

    # Legacy/informational only - see module docstring. Never used for
    # authorization; admin status is determined solely by email comparison
    # against settings.ADMIN_EMAIL.
    role: Mapped[str] = mapped_column(String(50), nullable=False, default="member")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_deleted: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    is_suspended: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    suspended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    suspended_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    suspended_by_id: Mapped[uuid.UUID | None] = mapped_column(GUID(), nullable=True)

    oauth_provider: Mapped[str | None] = mapped_column(String(50), nullable=True)
    oauth_id: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    avatar_url: Mapped[str | None] = mapped_column(String(500), nullable=True)

    failed_login_attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    last_login: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    theme_preference: Mapped[str] = mapped_column(String(20), nullable=False, default="system")
    notifications_enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )