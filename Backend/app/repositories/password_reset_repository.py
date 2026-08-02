"""Data access for PasswordResetToken (two-stage OTP flow)."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken


class PasswordResetRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def add(self, token: PasswordResetToken) -> None:
        self.db.add(token)

    async def get_active_by_user_id(self, user_id) -> PasswordResetToken | None:
        """Most recent unused reset flow for a user - used to invalidate a
        stale one when a new code is requested (e.g. 'Resend')."""
        result = await self.db.execute(
            select(PasswordResetToken)
            .where(PasswordResetToken.user_id == user_id, PasswordResetToken.used.is_(False))
            .order_by(PasswordResetToken.created_at.desc())
        )
        return result.scalars().first()

    async def get_by_reset_token_hash(self, reset_token_hash: str) -> PasswordResetToken | None:
        result = await self.db.execute(
            select(PasswordResetToken).where(PasswordResetToken.reset_token_hash == reset_token_hash)
        )
        return result.scalar_one_or_none()