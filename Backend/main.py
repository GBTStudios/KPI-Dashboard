"""Application entrypoint."""
import logging
import os  # <-- ADD THIS IMPORT
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles

from app.db.session import AsyncSessionLocal
from app.services.admin_seed_service import seed_admin_user
from app.api.v1.admin.users_routes import router as admin_users_router
from app.api.v1.auth.routes import router as auth_router
from app.api.v1.health.routes import router as health_router
from app.api.v1.users.routes import router as users_router
from app.api.v1.users.settings_routes import router as settings_router
from app.api.v1.kpis.routes import router as kpis_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.exceptions.handlers import register_exception_handlers
from app.middleware.logging_middleware import RequestContextMiddleware, SecurityHeadersMiddleware


setup_logging()
logger = logging.getLogger("groundpulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup - environment=%s", settings.ENVIRONMENT)
    async with AsyncSessionLocal() as db:
        await seed_admin_user(db)
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="GroundPulse API",
    description="Internal KPI Dashboard backend for Groundbreaker Studio.",
    version=settings.APP_VERSION,
    lifespan=lifespan,
)

# Order matters: outer-most added last executes first on the way in.
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(TrustedHostMiddleware, allowed_hosts=settings.trusted_hosts_list)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist  # <-- ADD THIS SECTION
UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    logger.info(f"Created uploads directory: {UPLOAD_DIR}")

# Create avatars subdirectory
AVATAR_DIR = os.path.join(UPLOAD_DIR, "avatars")
if not os.path.exists(AVATAR_DIR):
    os.makedirs(AVATAR_DIR)
    logger.info(f"Created avatars directory: {AVATAR_DIR}")

# Serve static files for uploaded avatars
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

register_exception_handlers(app)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
app.include_router(admin_users_router, prefix=settings.API_V1_PREFIX)
app.include_router(users_router, prefix=settings.API_V1_PREFIX)
app.include_router(settings_router, prefix=settings.API_V1_PREFIX)
app.include_router(kpis_router, prefix=settings.API_V1_PREFIX)