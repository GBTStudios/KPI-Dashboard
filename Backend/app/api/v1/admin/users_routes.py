"""Admin routes - User Management screen. Every route here requires the
single configured admin account (see require_admin dependency). There is
no role-change endpoint - admin status is fully automatic based on
settings.ADMIN_EMAIL, see User model docstring."""
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_client_ip, get_user_agent, require_admin
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.user import (
    BulkSuspendRequest,
    BulkUserIdsRequest,
    SuspendUserRequest,
    UserListItem,
    UserListResponse,
    UserOut,
    UserStatsOut,
)
from app.services.admin_user_service import AdminUserService

router = APIRouter(prefix="/admin/users", tags=["User Management (Admin)"])


def _service(db: AsyncSession, request: Request, actor: User) -> AdminUserService:
    return AdminUserService(db, actor, ip_address=get_client_ip(request), user_agent=get_user_agent(request))


@router.get("/stats", response_model=SuccessResponse[UserStatsOut], summary="Stat cards: total/active-admins/suspended")
async def get_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
):
    service = _service(db, request, actor)
    stats = await service.get_stats()
    return SuccessResponse(message="OK", data=UserStatsOut(**stats))


@router.get("", response_model=SuccessResponse[UserListResponse], summary="List/search/filter members")
async def list_users(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(require_admin),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    search: str | None = Query(None, description="Matches name or email"),
    role: str | None = Query(None),
    status_filter: str | None = Query(None, alias="status", description="active | suspended"),
):
    service = _service(db, request, actor)
    items, total = await service.list_users(page, page_size, search, role, status_filter)
    return SuccessResponse(
        message="OK",
        data=UserListResponse(
            items=[UserListItem.model_validate(u) for u in items],
            total=total, page=page, page_size=page_size,
        ),
    )


@router.post("/{user_id}/suspend", response_model=SuccessResponse[UserOut], summary="Suspend a member")
async def suspend_user(
    user_id: uuid.UUID, payload: SuspendUserRequest, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(require_admin),
):
    service = _service(db, request, actor)
    user = await service.suspend_user(user_id, payload.reason)
    return SuccessResponse(message="User suspended.", data=UserOut.model_validate(user))


@router.post("/{user_id}/unsuspend", response_model=SuccessResponse[UserOut], summary="Lift a suspension")
async def unsuspend_user(
    user_id: uuid.UUID, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(require_admin),
):
    service = _service(db, request, actor)
    user = await service.unsuspend_user(user_id)
    return SuccessResponse(message="User unsuspended.", data=UserOut.model_validate(user))


@router.delete("/{user_id}", response_model=SuccessResponse[None], status_code=status.HTTP_200_OK, summary="Soft-delete a member")
async def delete_user(
    user_id: uuid.UUID, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(require_admin),
):
    service = _service(db, request, actor)
    await service.delete_user(user_id)
    return SuccessResponse(message="User deleted.")


@router.post("/bulk-suspend", response_model=SuccessResponse[list[uuid.UUID]], summary="Suspend multiple members at once")
async def bulk_suspend(
    payload: BulkSuspendRequest, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(require_admin),
):
    service = _service(db, request, actor)
    succeeded = await service.bulk_suspend(payload.user_ids, payload.reason)
    return SuccessResponse(message=f"Suspended {len(succeeded)} of {len(payload.user_ids)} user(s).", data=succeeded)


@router.post("/bulk-delete", response_model=SuccessResponse[list[uuid.UUID]], summary="Delete multiple members at once")
async def bulk_delete(
    payload: BulkUserIdsRequest, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(require_admin),
):
    service = _service(db, request, actor)
    succeeded = await service.bulk_delete(payload.user_ids)
    return SuccessResponse(message=f"Deleted {len(succeeded)} of {len(payload.user_ids)} user(s).", data=succeeded)