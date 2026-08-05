"""Self-service routes - Settings screen. A user can only ever act on their
own account here; there's no user_id in any of these paths.

NOTE: /settings, /profile, and /avatar are handled by settings_routes.py.
This router previously also defined /settings (GET+PATCH) and /profile
(PATCH), which collided with settings_routes.py at the exact same paths -
FastAPI resolves that by registration order, so those endpoints here were
silently shadowing the real ones and calling UserSettingsService.update_settings
with the old (theme_preference, notifications_enabled) signature instead of
the current (user_id, data) signature, causing an AttributeError. Only
change-password is unique to this router, so that's all that's left here.
"""
from fastapi import APIRouter, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_client_ip, get_current_user, get_user_agent
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.user import ChangePasswordRequest
from app.services.user_settings_service import UserSettingsService

router = APIRouter(prefix="/users/me", tags=["Settings"])


def _service(db: AsyncSession, request: Request, user: User) -> UserSettingsService:
    return UserSettingsService(db, user, ip_address=get_client_ip(request), user_agent=get_user_agent(request))


@router.post("/change-password", response_model=SuccessResponse[None], summary="'Change Password' under Account")
async def change_password(
    payload: ChangePasswordRequest, request: Request,
    db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user),
):
    service = _service(db, request, current_user)
    await service.change_password(payload.current_password, payload.new_password)
    return SuccessResponse(message="Password changed. Other sessions have been signed out for security.")