"""KPI routes. Any authenticated user can access these (not admin-only) -
KpiEntry.tsx and KpiUpdate.tsx don't gate by role today."""
import uuid

from fastapi import APIRouter, Depends, Query, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_client_ip, get_current_user, get_user_agent
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.kpi import (
    CreateKpiRequest,
    DepartmentOut,
    KpiListResponse,
    KpiOut,
    MonthName,
    ParameterOut,
    UpdateKpiRequest,
    UpdateMonthRequest,
)
from app.services.kpi_service import KpiService, current_year

router = APIRouter(prefix="/kpis", tags=["KPIs"])


def _service(db: AsyncSession, request: Request, actor: User) -> KpiService:
    return KpiService(db, actor, ip_address=get_client_ip(request), user_agent=get_user_agent(request))


# --------------------------------------------------------------------- #
# Lookups - department/parameter dropdowns for KpiEntry.tsx's filters
# --------------------------------------------------------------------- #

@router.get("/departments", response_model=SuccessResponse[list[DepartmentOut]], summary="List departments")
async def list_departments(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    departments = await service.list_departments()
    return SuccessResponse(message="OK", data=departments)


@router.get("/parameters", response_model=SuccessResponse[list[ParameterOut]], summary="List parameters, optionally scoped to a department")
async def list_parameters(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
    department_id: uuid.UUID | None = Query(None),
):
    service = _service(db, request, actor)
    parameters = await service.list_parameters(department_id)
    return SuccessResponse(message="OK", data=parameters)


# --------------------------------------------------------------------- #
# KPI Indicators
# --------------------------------------------------------------------- #

@router.post("", response_model=SuccessResponse[KpiOut], status_code=status.HTTP_201_CREATED, summary="Create a KPI indicator")
async def create_kpi(
    payload: CreateKpiRequest, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
    year: int | None = Query(None, ge=2000, le=2100, description="Year the first monthly values belong to; defaults to the current year"),
):
    service = _service(db, request, actor)
    kpi = await service.create_kpi(payload, year if year is not None else current_year())
    return SuccessResponse(message="KPI created.", data=kpi)


@router.get("", response_model=SuccessResponse[KpiListResponse], summary="List/search/filter KPI indicators")
async def list_kpis(
    request: Request,
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    department: str | None = Query(None),
    parameter: str | None = Query(None),
    indicator: str | None = Query(None, description="Matches indicator_name"),
    year: int | None = Query(None, ge=2000, le=2100, description="Reporting year; defaults to the current year"),
):
    service = _service(db, request, actor)
    resolved_year = year if year is not None else current_year()
    items, total = await service.list_kpis(page, page_size, department, parameter, indicator, resolved_year)
    return SuccessResponse(
        message="OK",
        data=KpiListResponse(items=items, total=total, page=page, page_size=page_size),
    )


@router.get("/{kpi_id}", response_model=SuccessResponse[KpiOut], summary="Get one KPI with all its monthly values")
async def get_kpi(
    kpi_id: uuid.UUID, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
    year: int | None = Query(None, ge=2000, le=2100, description="Reporting year; defaults to the current year"),
):
    service = _service(db, request, actor)
    kpi = await service.get_kpi(kpi_id, year if year is not None else current_year())
    return SuccessResponse(message="OK", data=kpi)


@router.patch("/{kpi_id}", response_model=SuccessResponse[KpiOut], summary="Update indicator-level fields (annual target, person responsible, etc.)")
async def update_kpi(
    kpi_id: uuid.UUID, payload: UpdateKpiRequest, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
    year: int | None = Query(None, ge=2000, le=2100, description="Reporting year for the response; defaults to the current year"),
):
    service = _service(db, request, actor)
    kpi = await service.update_kpi(kpi_id, payload, year if year is not None else current_year())
    return SuccessResponse(message="KPI updated.", data=kpi)


@router.patch("/{kpi_id}/months/{month}", response_model=SuccessResponse[KpiOut], summary="Create or update a single month's actual/target value")
async def update_month(
    kpi_id: uuid.UUID, month: MonthName, payload: UpdateMonthRequest, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
    year: int | None = Query(None, ge=2000, le=2100, description="Year this month's value belongs to; defaults to the current year"),
):
    service = _service(db, request, actor)
    kpi = await service.update_month(kpi_id, month, year if year is not None else current_year(), payload)
    return SuccessResponse(message="Saved.", data=kpi)


@router.delete("/{kpi_id}", response_model=SuccessResponse[None], status_code=status.HTTP_200_OK, summary="Delete a KPI (cascades to its monthly values)")
async def delete_kpi(
    kpi_id: uuid.UUID, request: Request,
    db: AsyncSession = Depends(get_db), actor: User = Depends(get_current_user),
):
    service = _service(db, request, actor)
    await service.delete_kpi(kpi_id)
    return SuccessResponse(message="KPI deleted.")