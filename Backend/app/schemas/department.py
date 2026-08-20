"""Department Dashboard module schemas.

Every model here mirrors one interface in frontend/src/types/fundingDashboard.ts
1:1, field-for-field, so DepartmentDashboardOut slots into the existing
FundingSummaryCards / MonthlyPerformanceChart / ParameterPerformance /
KpiPerformanceTable / PerformanceHeatmap / AnnualTargetProgress /
MonthlyComparison / KpiAlerts / RecentActivity components with no prop
reshaping - only a snake_case -> camelCase mapper on the frontend, the
same pattern kpiService.ts and importService.ts already use for every
other module in this app. See the mapping table in the chat reply for
the exact field-name correspondence.

This is deliberately a SEPARATE response shape from DashboardOverviewOut
(app/schemas/dashboard.py) rather than a reuse of it - that one already
has a different, incompatible field vocabulary (SummaryCardsOut vs.
FundingSummaryCard, MapPerformancePointOut vs. MonthlyTrendPoint, etc.)
built for the org-wide Dashboard page, not the per-department one. Both
now share the same underlying DashboardRepository query pattern
(get_department_year_rows here plays the same role as get_kpi_year_rows
there), just formatted differently for two different frontend pages.

ASSUMPTIONS flagged explicitly (not guessed silently) because I don't
have FundingSummaryCards.tsx / PerformanceHeatmap.tsx / AnnualTargetProgress.tsx
to confirm exact icon-name strings, color hex codes, or "no data" cell
handling against:
  - `icon` values are semantic strings (e.g. "target", "trending-up",
    "alert-circle", "layers") - adjust in DepartmentDashboardService if
    FundingSummaryCards.tsx expects a different icon-name vocabulary.
  - HeatmapCellStatus has no 4th "no data" state in the frontend type,
    so a month with no KpiMonthlyValue row renders as status
    "below-target" with value_label "No data" - the closest honest
    option given the 3-value enum, not a fabricated percentage.
  - AnnualTargetProgress assumes one dominant measurement_unit across
    the indicators being summed (see _dominant_unit in the service) -
    mixing EUR and COUNT indicators into one target/current sum would
    be meaningless, so indicators outside the dominant unit are excluded
    from that one card (not from the rest of the dashboard).
"""
from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

SummaryCardTone = Literal["primary", "success", "danger", "neutral"]
KpiStatus = Literal["On Target", "Near Target", "Below Target"]
KpiTrend = Literal["up", "down"]
HeatmapCellStatus = Literal["on-target", "at-risk", "below-target"]
ComparisonDirection = Literal["up", "down"]
AlertTone = Literal["danger", "warning", "success"]


class DepartmentOut(BaseModel):
    id: UUID
    name: str


class DepartmentListResponse(BaseModel):
    departments: list[DepartmentOut]


class FundingSummaryCardOut(BaseModel):
    title: str
    value: str
    change_label: str | None = None
    change_direction: ComparisonDirection | None = None
    supporting_text: str
    icon: str
    tone: SummaryCardTone


class MonthlyTrendPointOut(BaseModel):
    month: str
    actual: float
    target: float


class ParameterPerformanceItemOut(BaseModel):
    name: str
    percentage: float
    color: str


class KpiOverviewRowOut(BaseModel):
    indicator: str
    annual_target: float
    current_ytd: float
    achievement: float
    status: KpiStatus
    trend: KpiTrend


class HeatmapCellOut(BaseModel):
    status: HeatmapCellStatus
    value_label: str | None = None


class HeatmapRowOut(BaseModel):
    indicator: str
    cells: list[HeatmapCellOut] = Field(min_length=12, max_length=12)


class AnnualTargetProgressOut(BaseModel):
    target_label: str
    current_label: str
    percentage: float
    remaining_label: str
    days_left_label: str


class ComparisonItemOut(BaseModel):
    label: str
    change_label: str
    direction: ComparisonDirection


class AlertItemOut(BaseModel):
    id: str
    title: str
    description: str
    tone: AlertTone


class RecentActivityItemOut(BaseModel):
    id: UUID
    actor: str
    action: str
    timestamp: datetime


class DepartmentFilterOptionsOut(BaseModel):
    departments: list[DepartmentOut]
    years: list[int]
    months: list[str]
    parameters: list[str]  # scoped to the requested department - see route


class DepartmentDashboardOut(BaseModel):
    department_id: UUID
    department: str
    year: int
    month: str | None
    parameter: str | None
    page_title: str | None = None
    page_subtitle: str | None = None
    summary_cards: list[FundingSummaryCardOut]
    monthly_trend: list[MonthlyTrendPointOut]
    parameter_performance: list[ParameterPerformanceItemOut]
    kpi_overview_rows: list[KpiOverviewRowOut]
    heatmap_rows: list[HeatmapRowOut]
    annual_target_progress: AnnualTargetProgressOut
    monthly_comparison: list[ComparisonItemOut]
    kpi_alerts: list[AlertItemOut]
    recent_activity: list[RecentActivityItemOut]