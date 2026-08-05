"""Seeds a single administrator account on application startup.

Runs once per process start. If a user with settings.ADMIN_EMAIL already
exists, this is a complete no-op - it never touches their password, name,
or any other field, so a later password change or restart never overwrites
anything. This is the ONLY place an admin account is ever created; there is
no route, no role-change endpoint, and no other code path that produces one.
"""
import logging

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import hash_password
from app.models.user import User
from app.repositories.user_repository import UserRepository

logger = logging.getLogger("groundpulse")


async def seed_admin_user(db: AsyncSession) -> None:
    if not settings.ADMIN_EMAIL or not settings.ADMIN_INITIAL_PASSWORD:
        logger.warning(
            "ADMIN_EMAIL or ADMIN_INITIAL_PASSWORD not set in .env - skipping admin seed. "
            "The application will start, but no admin account will exist."
        )
        return

    users = UserRepository(db)
    existing = await users.get_by_email(settings.ADMIN_EMAIL)
    if existing is not None:
        logger.info("Admin account already exists (email=%s) - skipping seed.", settings.ADMIN_EMAIL)
        return

    admin = User(
        full_name=settings.ADMIN_NAME or "Administrator",
        email=settings.ADMIN_EMAIL.lower().strip(),
        password_hash=hash_password(settings.ADMIN_INITIAL_PASSWORD),
        is_verified=True,
        is_active=True,
    )
    users.add(admin)
    await db.commit()
    logger.info("Seeded administrator account email=%s", settings.ADMIN_EMAIL)