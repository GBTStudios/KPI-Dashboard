"""Health check endpoint."""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.dependencies.db import get_db

logger = logging.getLogger("groundpulse")
router = APIRouter(tags=["Health"])


@router.get("/health", summary="Application + database health check")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "up"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as exc:
        logger.error("Health check DB connectivity failure: %s", exc, exc_info=True)
        db_status = "down"

    return {
        "status": "ok" if db_status == "up" else "degraded",
        "database": db_status,
        "version": settings.APP_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }