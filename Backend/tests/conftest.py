"""Test fixtures: in-memory SQLite DB, overriding get_db, and an httpx client
against the real FastAPI app (real HTTP calls through the ASGI app, not just
calling service functions directly)."""
import asyncio
import uuid

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.db.base import Base
from app.dependencies.db import get_db

# IMPORTANT: models must be imported before Base.metadata.create_all() runs,
# or Base.metadata never learns about the User/RefreshToken/AuditLog/
# PasswordResetToken tables and create_all() silently creates nothing.
import app.models.user  # noqa: F401
import app.models.refresh_token  # noqa: F401
import app.models.audit_log  # noqa: F401
import app.models.password_reset_token  # noqa: F401

TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(db_engine):
    session_factory = async_sessionmaker(bind=db_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_factory() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine):
    from main import app

    session_factory = async_sessionmaker(bind=db_engine, class_=AsyncSession, expire_on_commit=False)

    async def _override_get_db():
        async with session_factory() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()

    app.dependency_overrides[get_db] = _override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


def unique_email() -> str:
    return f"user_{uuid.uuid4().hex[:10]}@example.com"


VALID_PASSWORD = "StrongPass1!"
