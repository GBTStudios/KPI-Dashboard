"""Dashboard module schemas.

Single composite response (DashboardOverviewOut) backs one GET /dashboard/overview
call - see app/services/dashboard_service.py for why this is one aggregation
pass over one flattened query rather than six separate endpoints/queries.

Every numeric "percentage" field here is either directly the stored
KpiMonthlyValue.percentage (never recomputed) or an average/sum of those
stored values - never invented, per the brief. A field is `None` rather
than 0 whenever there's genuinely no data to compute from (e.g. a
department with no recorded monthly values yet) - 0 would imply
"measured, scored zero," which is a different, false statement.
"""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

KpiStatus = Literal["On Target", "Near Target", "Below Target"]


class SummaryCardsOut(BaseModel):
    """The 4 cards at the top of the dashboard.

    overall_achievement_pct: average of `percentage` across every
    (indicator, month) cell in the selected year that has one - a
    whole-year rollup, not scoped to month_a/month_b.

    kpis_on_track / kpis_below_target / kpis_total: each indicator's
    status at month_b (>=70% on-track, <70% below-target; indicators
    with no percentage at month_b are excluded from all three counts -
    "no data" is not "below target").

    departments_improving / departments_total: departments_total counts
    only departments with data in BOTH month_a and month_b (a valid
    before/after comparison needs both ends); departments_improving is
    how many of those have a higher average percentage at month_b than
    at month_a. "N departments declined" in the UI is
    departments_total - departments_improving.
    """
    overall_achievement_pct: float | None
    kpis_on_track: int
    kpis_below_target: int
    kpis_total: int
    departments_improving: int
    departments_total: int


class MapPerformancePointOut(BaseModel):
    month: str  # "Jan".."Dec"
    actual: float | None  # avg percentage across indicators with data that month; None if none had data
    target: float  # always 100.0 - see module docstring


class DepartmentPerformanceOut(BaseModel):
    department: str
    percentage: float  # avg percentage across that dept's indicators at month_b; departments with no data that month are omitted entirely, not sent as 0
    color: str  # deterministic palette assignment, not derived from data - purely presentational


class KpiTableRowOut(BaseModel):
    """One row of 'KPIs requiring attention', pre-sorted by |change|
    descending and pre-limited to `limit` rows by the service - the
    frontend does no further sorting/slicing."""
    indicator: str
    department: str
    month_a_value: float | None
    month_b_value: float | None
    change: float | None  # month_b_value - month_a_value; None if either side is missing
    status: KpiStatus | None  # from month_b_value; None if month_b_value is missing


class AnnualProgressItemOut(BaseModel):
    """Full-year progress per indicator: sum(actual, treating missing
    months as 0) / sum(target, treating missing months as annual_target/12)
    * 100 - the exact same convention KpiEntry.tsx/KpiUpdate.tsx already
    use client-side (getEndOfYearActual/getEndOfYearTarget), so these
    numbers agree with what those pages show for the same indicator."""
    label: str
    percentage: float | None  # None only if annual_target is somehow 0 (division guard)
    color: str  # same deterministic palette as DepartmentPerformanceOut


class RecentActivityItemOut(BaseModel):
    id: UUID
    actor: str
    action: str
    timestamp: datetime


class DashboardFilterOptionsOut(BaseModel):
    """Populates the dropdowns themselves from real data - no hardcoded
    department/year lists on either side."""
    years: list[int]  # distinct years with any kpi_monthly_values row, plus the current calendar year even if empty
    months: list[str]  # fixed ["Jan",...,"Dec"] - these are calendar months, legitimately static
    departments: list[str]  # distinct department names that exist, "All" NOT included here - the frontend adds that sentinel itself


class DashboardOverviewOut(BaseModel):
    year: int
    month_a: str
    month_b: str
    department_filter: str | None
    summary: SummaryCardsOut
    map_performance: list[MapPerformancePointOut]
    department_performance: list[DepartmentPerformanceOut]
    kpi_table: list[KpiTableRowOut]
    annual_progress: list[AnnualProgressItemOut]
    recent_activity: list[RecentActivityItemOut]
    filter_options: DashboardFilterOptionsOut
