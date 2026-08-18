"""Department Dashboard routes. Read-only, any authenticated user - same
access level as /dashboard/overview and /kpis (see that module's routes.py
for the precedent - none of these pages are admin-gated in this app)."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.department_dashboard import (
    DepartmentDashboardOut,
    DepartmentFilterOptionsOut,
    DepartmentListResponse,
)
from app.services.department_dashboard_service import DepartmentDashboardService

router = APIRouter(prefix="/dashboard/departments", tags=["Department Dashboard"])


@router.get("", response_model=SuccessResponse[DepartmentListResponse], summary="List departments for the selector")
async def list_departments(
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    service = DepartmentDashboardService(db)
    data = await service.list_departments()
    return SuccessResponse(message="OK", data=data)


@router.get(
    "/{department_id}/overview",
    response_model=SuccessResponse[DepartmentDashboardOut],
    summary="Everything one department's dashboard page needs, in one call",
)
async def get_department_overview(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
    year: int = Query(default_factory=lambda: datetime.now(timezone.utc).year, ge=2000, le=2100),
    month: str | None = Query(None, description="3-letter month, e.g. 'Jun'. Omit for the full year / latest available month."),
    parameter: str | None = Query(None, description="Exact parameter name within this department; omit for all parameters"),
):
    service = DepartmentDashboardService(db)
    overview = await service.get_department_dashboard(department_id, year, month, parameter)
    return SuccessResponse(message="OK", data=overview)


@router.get(
    "/{department_id}/filter-options",
    response_model=SuccessResponse[DepartmentFilterOptionsOut],
    summary="Populates the Department/Year/Month/Parameter dropdowns from real data",
)
async def get_department_filter_options(
    department_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
    year: int = Query(default_factory=lambda: datetime.now(timezone.utc).year, ge=2000, le=2100),
):
    service = DepartmentDashboardService(db)
    data = await service.get_filter_options(department_id, year)
    return SuccessResponse(message="OK", data=data)