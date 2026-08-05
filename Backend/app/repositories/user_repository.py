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

    # FIX: These methods were at module level, move them inside the class
    async def list_users(
        self,
        page: int = 1,
        page_size: int = 10,
        search: str | None = None,
        role: str | None = None,
        status_filter: str | None = None,  # "active" | "suspended" | "pending" | "inactive"
    ) -> tuple[list, int]:
        """Returns (items, total_count) for the User Management table -
        pagination + search-by-name/email + role/status filters."""
        from sqlalchemy import func, or_, select
        from app.models.user import User

        query = select(User).where(User.is_deleted.is_(False))
        count_query = select(func.count()).select_from(User).where(User.is_deleted.is_(False))

        if search:
            like = f"%{search.strip()}%"
            clause = or_(User.full_name.ilike(like), User.email.ilike(like))
            query = query.where(clause)
            count_query = count_query.where(clause)

        if role:
            query = query.where(User.role == role)
            count_query = count_query.where(User.role == role)

        if status_filter == "suspended":
            query = query.where(User.is_suspended.is_(True))
            count_query = count_query.where(User.is_suspended.is_(True))
        elif status_filter == "pending":
            query = query.where(User.is_suspended.is_(False), User.is_verified.is_(False))
            count_query = count_query.where(User.is_suspended.is_(False), User.is_verified.is_(False))
        elif status_filter == "active":
            query = query.where(User.is_suspended.is_(False), User.is_verified.is_(True), User.is_active.is_(True))
            count_query = count_query.where(User.is_suspended.is_(False), User.is_verified.is_(True), User.is_active.is_(True))
        elif status_filter == "inactive":
            query = query.where(User.is_suspended.is_(False), User.is_active.is_(False))
            count_query = count_query.where(User.is_suspended.is_(False), User.is_active.is_(False))

        total = (await self.db.execute(count_query)).scalar_one()

        query = query.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items = (await self.db.execute(query)).scalars().all()

        return list(items), total

    async def get_stats(self) -> dict:
        """Backs the three stat cards: total members, active admins, suspended accounts.

        NOTE on `active_admins`: kept as this key name only because the
        frontend's stat card is labeled "Active Admins" and reads it as such.
        It currently counts ALL active (non-suspended, active, non-deleted)
        users - not specifically admins - because OrgUser has no `role` field
        on the frontend yet. This intentionally matches what
        UserManagement.tsx computes locally today:
        `users.filter(u => u.status === "active").length`.
        If a real role field is added to the frontend later, swap the
        `.where(...)` below back to also filter
        User.role.in_(("admin", "superadmin")) - nothing else needs to change."""
        from sqlalchemy import func, select
        from app.models.user import User

        total = (await self.db.execute(
            select(func.count()).select_from(User).where(User.is_deleted.is_(False))
        )).scalar_one()

        active_admins = (await self.db.execute(
            select(func.count()).select_from(User).where(
                User.is_deleted.is_(False),
                User.is_suspended.is_(False),
                User.is_active.is_(True),
            )
        )).scalar_one()

        suspended = (await self.db.execute(
            select(func.count()).select_from(User).where(User.is_deleted.is_(False), User.is_suspended.is_(True))
        )).scalar_one()

        return {"total_members": total, "active_admins": active_admins, "suspended_accounts": suspended}