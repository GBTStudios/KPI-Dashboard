"""Dashboard routes. Read-only, any authenticated user - same access level
as /kpis (Dashboard.tsx isn't behind an admin-only guard any more than
KpiEntry.tsx/KpiUpdate.tsx are)."""
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies.auth import get_current_user
from app.dependencies.db import get_db
from app.models.user import User
from app.schemas.common import SuccessResponse
from app.schemas.dashboard import DashboardOverviewOut
from app.services.dashboard_service import MONTHS, DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


def _default_months() -> tuple[str, str]:
    """month_b = current calendar month, month_a = the month before it -
    a reasonable default comparison pair when the frontend doesn't pass
    one explicitly (e.g. first load)."""
    now = datetime.now(timezone.utc)
    b_idx = now.month
    a_idx = 12 if b_idx == 1 else b_idx - 1
    return MONTHS[a_idx - 1], MONTHS[b_idx - 1]


@router.get("/overview", response_model=SuccessResponse[DashboardOverviewOut], summary="Everything the Dashboard page needs, in one call")
async def get_overview(
    db: AsyncSession = Depends(get_db),
    actor: User = Depends(get_current_user),
    year: int = Query(default_factory=lambda: datetime.now(timezone.utc).year, ge=2000, le=2100),
    month_a: str | None = Query(None, description="3-letter month, e.g. 'May'. Defaults to the month before month_b."),
    month_b: str | None = Query(None, description="3-letter month, e.g. 'Jun'. Defaults to the current calendar month."),
    department: str | None = Query(None, description="Exact department name; omit for all departments"),
    kpi_table_limit: int = Query(10, ge=1, le=50, description="Max rows in the 'KPIs requiring attention' table"),
):
    default_a, default_b = _default_months()
    resolved_a = month_a or default_a
    resolved_b = month_b or default_b

    service = DashboardService(db)
    overview = await service.get_overview(
        year=year,
        month_a=resolved_a,
        month_b=resolved_b,
        department=department,
        kpi_table_limit=kpi_table_limit,
    )
    return SuccessResponse(message="OK", data=overview)
