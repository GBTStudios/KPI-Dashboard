"""Application entrypoint."""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.api.v1.auth.routes import router as auth_router
from app.api.v1.health.routes import router as health_router
from app.core.config import settings
from app.core.logging import setup_logging
from app.exceptions.handlers import register_exception_handlers
from app.middleware.logging_middleware import RequestContextMiddleware, SecurityHeadersMiddleware

setup_logging()
logger = logging.getLogger("groundpulse")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Application startup - environment=%s", settings.ENVIRONMENT)
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

register_exception_handlers(app)

app.include_router(auth_router, prefix=settings.API_V1_PREFIX)
app.include_router(health_router, prefix=settings.API_V1_PREFIX)
