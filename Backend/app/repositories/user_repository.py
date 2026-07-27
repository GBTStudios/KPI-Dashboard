"""Data access for User. No business logic here - just queries."""
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User


class UserRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return await self.db.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        result = await self.db.execute(select(User).where(User.email == email.lower()))
        return result.scalar_one_or_none()

    async def get_by_oauth(self, provider: str, oauth_id: str) -> User | None:
        result = await self.db.execute(
            select(User).where(User.oauth_provider == provider, User.oauth_id == oauth_id)
        )
        return result.scalar_one_or_none()

    def add(self, user: User) -> None:
        self.db.add(user)

    async def flush(self) -> None:
        await self.db.flush()
