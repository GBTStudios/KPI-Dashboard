"""User settings endpoints - profile, theme, notifications.

NOTE: /settings and /profile responses are wrapped in SuccessResponse to
match the envelope every other endpoint in this app uses ({success,
message, data}) - api.ts's request() always unwraps `json.data`. These two
routes previously returned the raw Pydantic model with no `data` key,
so the frontend read `data` as undefined and threw a TypeError that got
swallowed into a generic "Could not save settings" message, even though
the request succeeded (200) every time. /avatar is left unwrapped on
purpose - Layout.tsx calls it via a raw fetch() and already destructures
`{ avatar_url }` directly from the body.
"""
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Request
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.user import UserSettingsUpdate, UserSettingsOut, UserOut, UpdateProfileRequest
from app.services.user_settings_service import UserSettingsService

router = APIRouter()


@router.get("/users/me/settings", response_model=SuccessResponse[UserSettingsOut])
async def get_settings(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get current user's settings."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserSettingsService(db, current_user, ip_address, user_agent)
    result = await service.get_settings(current_user.id)
    return SuccessResponse(message="OK", data=result)


@router.patch("/users/me/settings", response_model=SuccessResponse[UserSettingsOut])
async def update_settings(
    request: Request,
    data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user settings (theme, notifications, etc.)."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserSettingsService(db, current_user, ip_address, user_agent)
    result = await service.update_settings(current_user.id, data)
    return SuccessResponse(message="Settings saved.", data=result)


@router.post("/users/me/avatar", response_model=dict)
async def upload_avatar(
    request: Request,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Upload a profile avatar image."""
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Validate file size (max 5MB)
    file.file.seek(0, 2)
    size = file.file.tell()
    file.file.seek(0)
    if size > 5 * 1024 * 1024:  # 5MB
        raise HTTPException(status_code=400, detail="File too large. Max size is 5MB")

    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserSettingsService(
        db, current_user, ip_address, user_agent,
        base_url=str(request.base_url),
    )
    avatar_url = await service.upload_avatar(current_user.id, file)
    return {"avatar_url": avatar_url}


@router.patch("/users/me/profile", response_model=SuccessResponse[UserOut])
async def update_profile(
    request: Request,
    data: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update user profile information."""
    ip_address = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    service = UserSettingsService(db, current_user, ip_address, user_agent)
    result = await service.update_profile(current_user.id, data.full_name)
    return SuccessResponse(message="Profile updated.", data=result)