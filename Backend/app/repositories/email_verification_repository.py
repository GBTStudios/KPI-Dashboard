"""Data access for EmailVerificationToken. Mirrors PasswordResetRepository -
no business logic here, just queries."""
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.email_verification_token import EmailVerificationToken


class EmailVerificationRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def add(self, token_row: EmailVerificationToken) -> None:
        self.db.add(token_row)

    async def get_by_hash(self, token_hash: str) -> EmailVerificationToken | None:
        result = await self.db.execute(
            select(EmailVerificationToken).where(EmailVerificationToken.token_hash == token_hash)
        )
        return result.scalar_one_or_none()