"""Business logic for the Settings screen. Self-service only - a user can
only ever act on their own account here; there is no user_id parameter
anywhere in this service."""
import logging
import uuid
import os
import shutil
from pathlib import Path
from typing import Optional
from fastapi import UploadFile, HTTPException

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, validate_password_strength, verify_password
from app.exceptions.custom_exceptions import IncorrectPasswordException, WeakPasswordException
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.refresh_token_repository import RefreshTokenRepository
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserSettingsOut, UserSettingsUpdate, UserOut

logger = logging.getLogger("groundpulse")


class UserSettingsService:
    def __init__(self, db: AsyncSession, user: User, ip_address: str | None = None, user_agent: str | None = None, base_url: str | None = None,):

        self.db = db
        self.user = user
        self.repo = UserRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)
        self.audit = AuditLogRepository(db)
        self.ip_address = ip_address
        self.user_agent = user_agent
        self.base_url = base_url

    async def get_settings(self, user_id: uuid.UUID) -> UserSettingsOut:
        """Get user settings."""
        return UserSettingsOut(
            full_name=self.user.full_name,
            email=self.user.email,
            avatar_url=self.user.avatar_url,
            theme_preference=self.user.theme_preference if hasattr(self.user, 'theme_preference') else "light",
            notifications_enabled=self.user.notifications_enabled if hasattr(self.user, 'notifications_enabled') else True
        )

    async def update_settings(self, user_id: uuid.UUID, data: UserSettingsUpdate) -> UserSettingsOut:
        """Update user settings."""
        if data.theme_preference is not None:
            self.user.theme_preference = data.theme_preference
        if data.notifications_enabled is not None:
            self.user.notifications_enabled = data.notifications_enabled

        self.audit.add(
            "SETTINGS_UPDATED", user_id=self.user.id,
            description=f"theme={data.theme_preference} notifications={data.notifications_enabled}",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )

        await self.db.commit()
        await self.db.refresh(self.user)

        logger.info("Settings updated user_id=%s", self.user.id)
        return await self.get_settings(user_id)

    async def upload_avatar(self, user_id: uuid.UUID, file: UploadFile) -> str:
        """Upload and save avatar image."""
        # Create uploads directory if it doesn't exist
        upload_dir = Path("uploads/avatars")
        upload_dir.mkdir(parents=True, exist_ok=True)

        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1] if file.filename else ".jpg"
        filename = f"{user_id}{file_extension}"
        file_path = upload_dir / filename

        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Build an absolute URL so it's valid regardless of which origin
        # (or component) later renders it — not just relative to whatever
        # page happens to be loaded.
        relative_path = f"/uploads/avatars/{filename}"
        avatar_url = f"{self.base_url.rstrip('/')}{relative_path}" if self.base_url else relative_path
        self.user.avatar_url = avatar_url

        self.audit.add(
            "AVATAR_UPDATED", user_id=self.user.id, description="Profile avatar updated",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )

        await self.db.commit()
        await self.db.refresh(self.user)

        logger.info("Avatar updated user_id=%s", self.user.id)
        return avatar_url

    async def update_profile(self, user_id: uuid.UUID, full_name: str) -> UserOut:
        """Update user profile."""
        if full_name:
            self.user.full_name = full_name.strip()

        self.audit.add(
            "PROFILE_UPDATED", user_id=self.user.id, description="Full name updated",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )

        await self.db.commit()
        await self.db.refresh(self.user)

        logger.info("Profile updated user_id=%s", self.user.id)
        return UserOut(
            id=self.user.id,
            full_name=self.user.full_name,
            email=self.user.email,
            avatar_url=self.user.avatar_url,
            role=self.user.role,
            is_verified=self.user.is_verified,
            is_suspended=self.user.is_suspended,
            is_active=self.user.is_active,
            oauth_provider=self.user.oauth_provider,
            created_at=self.user.created_at,
            last_login=self.user.last_login
        )

    async def change_password(self, current_password: str, new_password: str) -> None:
        """Change user password."""
        # 1. Verify current password
        if self.user.password_hash is None or not verify_password(current_password, self.user.password_hash):
            self.audit.add(
                "PASSWORD_CHANGE_FAILED", user_id=self.user.id, description="Incorrect current password",
                ip_address=self.ip_address, user_agent=self.user_agent,
            )
            await self.db.commit()  # ✅ Commit the audit log
            raise IncorrectPasswordException()

        # 2. Validate new password strength
        try:
            validate_password_strength(new_password)
        except WeakPasswordException as e:
            self.audit.add(
                "PASSWORD_CHANGE_FAILED", user_id=self.user.id,
                description=f"Weak password: {str(e)}",
                ip_address=self.ip_address, user_agent=self.user_agent,
            )
            await self.db.commit()  # ✅ Commit the audit log
            raise

        # 3. Hash and set new password
        self.user.password_hash = hash_password(new_password)

        # 4. Revoke all existing refresh tokens (force re-login on all devices)
        await self.refresh_tokens.revoke_all_for_user(self.user.id)

        # 5. Log the successful change
        self.audit.add(
            "PASSWORD_CHANGED", user_id=self.user.id, description="Password changed via Settings",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )

        # ✅ CRITICAL: Commit all changes to the database!
        await self.db.commit()

        logger.info("Password changed user_id=%s", self.user.id)