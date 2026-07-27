"""Data access for RefreshToken (rotation + revocation)."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.refresh_token import RefreshToken


class RefreshTokenRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    def add(self, token: RefreshToken) -> None:
        self.db.add(token)

    async def get_by_hash(self, token_hash: str) -> RefreshToken | None:
        result = await self.db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
        return result.scalar_one_or_none()

    async def revoke(self, token: RefreshToken, replaced_by_id: uuid.UUID | None = None) -> None:
        from datetime import datetime, timezone
        token.revoked = True
        token.revoked_at = datetime.now(timezone.utc)
        if replaced_by_id:
            token.replaced_by_id = replaced_by_id

    async def revoke_all_for_user(self, user_id: uuid.UUID) -> None:
        from datetime import datetime, timezone
        result = await self.db.execute(
            select(RefreshToken).where(RefreshToken.user_id == user_id, RefreshToken.revoked.is_(False))
        )
        for token in result.scalars().all():
            token.revoked = True
            token.revoked_at = datetime.now(timezone.utc)
