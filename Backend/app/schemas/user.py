"""User-facing schemas (never includes password_hash)."""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, computed_field, field_validator


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    is_suspended: bool
    oauth_provider: str | None
    avatar_url: str | None
    created_at: datetime
    last_login: datetime | None


# --------------------------------------------------------------------- #
# User Management screen (admin-facing)
# --------------------------------------------------------------------- #

class UserListItem(BaseModel):
    """One row of the User Management table. Matches the frontend's
    `UserStatus = "active" | "suspended"` exactly - no "pending"/"inactive"
    states are exposed here, even though the backend still tracks
    is_verified/is_active separately for other purposes."""
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    avatar_url: str | None
    role: str
    is_suspended: bool
    is_active: bool
    is_verified: bool
    last_login: datetime | None
    created_at: datetime

    @computed_field
    @property
    def status(self) -> Literal["active", "suspended"]:
        return "suspended" if self.is_suspended else "active"


class UserListResponse(BaseModel):
    items: list[UserListItem]
    total: int
    page: int
    page_size: int


class UserStatsOut(BaseModel):
    """Backs the three stat cards at the top of User Management.

    NOTE: `active_admins` is a misleading name kept only because the
    frontend's stat card is already labeled "Active Admins" and reads this
    key - it counts ALL active (non-suspended, active, non-deleted) users,
    not specifically the one admin account, matching exactly what
    UserManagement.tsx computes locally today
    (`users.filter(u => u.status === "active").length`)."""
    total_members: int
    active_admins: int
    suspended_accounts: int


# NOTE: no UpdateRoleRequest / role-change endpoint. Admin status is fully
# automatic based on settings.ADMIN_EMAIL - see User model docstring and
# dependencies/auth.py:get_current_user. There is intentionally no way to
# grant or revoke admin through the API.


class SuspendUserRequest(BaseModel):
    """`reason` is optional because the current UI's suspend confirmation
    modal has no text field to collect one - it's a plain confirm dialog.
    If a reason is provided (e.g. from a future admin tool), it's still
    stored and audited; if omitted, a generic reason is recorded instead."""
    reason: str | None = Field(default=None, max_length=500)


class BulkUserIdsRequest(BaseModel):
    """Backs the row checkboxes + a bulk delete/similar action with no extra fields."""
    user_ids: list[uuid.UUID] = Field(min_length=1, max_length=200)


class BulkSuspendRequest(BaseModel):
    user_ids: list[uuid.UUID] = Field(min_length=1, max_length=200)
    reason: str | None = Field(default=None, max_length=500)


# --------------------------------------------------------------------- #
# Settings screen (self-service)
# --------------------------------------------------------------------- #

class UserSettingsOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    full_name: str
    email: str
    avatar_url: str | None
    theme_preference: str = "light"
    notifications_enabled: bool


# ADD THIS CLASS - It's what settings_routes.py is looking for
class UserSettingsUpdate(BaseModel):
    """Used by settings_routes.py to update user settings."""
    theme_preference: Literal["dark", "light", "system"] | None = None
    notifications_enabled: bool | None = None


class UpdateSettingsRequest(BaseModel):
    """Backs the 'Save Changes' button - Appearance + Notifications."""
    theme_preference: Literal["dark", "light", "system"]
    notifications_enabled: bool


class UpdateProfileRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=255)


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str

    @field_validator("confirm_password")
    @classmethod
    def passwords_match(cls, v: str, info) -> str:
        if "new_password" in info.data and v != info.data["new_password"]:
            raise ValueError("PASSWORDS_DO_NOT_MATCH")
        return v