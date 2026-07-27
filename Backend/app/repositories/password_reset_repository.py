"""Data access for PasswordResetToken."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.password_reset_token import PasswordResetToken


class PasswordResetRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def add(self, token: PasswordResetToken) -> None:
        self.db.add(token)

    async def get_by_hash(self, token_hash: str) -> PasswordResetToken | None:
        result = await self.db.execute(
            select(PasswordResetToken).where(PasswordResetToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()
