"""DB session dependency.

Key distinction (this fixed a real bug during development): AppException
represents an *expected* business outcome (bad password, weak password,
locked account, etc). Its side effects - failed-attempt counters, audit log
rows - must still be committed. Only genuinely unexpected errors should roll
back the transaction.
"""
import logging

from app.db.session import AsyncSessionLocal
from app.exceptions.custom_exceptions import AppException

logger = logging.getLogger("groundpulse")


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except AppException:
            await session.commit()
            raise
        except Exception:
            await session.rollback()
            logger.error("Session rolled back due to unexpected error", exc_info=True)
            raise
        finally:
            await session.close()
