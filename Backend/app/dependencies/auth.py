"""FastAPI dependencies: current user extraction from the Access token, and
request metadata (ip/user-agent) for audit logging."""
import uuid

from fastapi import Depends, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.dependencies.db import get_db
from app.exceptions.custom_exceptions import AccountInactiveException, UnauthorizedException
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

    set_user_id(str(user.id))
    return user
