"""FastAPI dependencies: current user extraction from the Access token,
the single-admin guard for admin routes, and request metadata (ip/user-agent)
for audit logging.

ADMIN MODEL: there is exactly one administrator account, identified purely
by settings.ADMIN_EMAIL (seeded on startup - see
app/services/admin_seed_service.py). There is no role or permission system:
require_admin below does a direct email comparison and nothing else. The
`role` column on User is legacy/informational only and is never consulted
for authorization anywhere in this file.
"""
import uuid

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import decode_token
from app.dependencies.db import get_db
from app.exceptions.custom_exceptions import (
    AccountInactiveException,
    AccountSuspendedException,
    ForbiddenException,
    UnauthorizedException,
)
from app.middleware.request_context import set_user_id
from app.models.user import User
from app.repositories.user_repository import UserRepository

_bearer_scheme = HTTPBearer(auto_error=False)


def get_client_ip(request: Request) -> str | None:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


def get_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    if credentials is None:
        raise UnauthorizedException("Missing bearer token.")

    payload = decode_token(credentials.credentials, expected_type="access")
    user = await UserRepository(db).get_by_id(uuid.UUID(payload["sub"]))
    if user is None:
        raise UnauthorizedException("User no longer exists.")
    if not user.is_active:
        raise AccountInactiveException()
    if user.is_suspended:
        raise AccountSuspendedException(user.suspended_reason)

    set_user_id(str(user.id))
    return user


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Restricts a route to the single seeded administrator account,
    identified purely by settings.ADMIN_EMAIL - a plain email comparison,
    exactly as specified. No role or permission concept involved."""
    if not settings.ADMIN_EMAIL or current_user.email.lower() != settings.ADMIN_EMAIL.lower():
        raise ForbiddenException("Admin access required.")
    return current_user