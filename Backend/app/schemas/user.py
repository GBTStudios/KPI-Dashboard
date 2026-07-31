"""User-facing schemas (never includes password_hash)."""
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    full_name: str
    email: str
    role: str
    is_active: bool
    is_verified: bool
    oauth_provider: str | None
    avatar_url: str | None
    created_at: datetime
    last_login: datetime | None
