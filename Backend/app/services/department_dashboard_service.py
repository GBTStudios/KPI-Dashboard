"""Business logic for the Department Dashboard - the per-department page
FundingSummaryCards/MonthlyPerformanceChart/etc. actually render against
(department-dashboard-frontend/src/pages/DepartmentDashboard.tsx). "Funding"
is not special-cased anywhere in this file - it is exactly one row in the
departments table, exercised through the same code path as any other
department. The mock departmentDashboardData.ts entry for Funding is what
this endpoint replaces, the same as every other department's entry.

Reuses DashboardRepository.get_department_year_rows (one LEFT JOIN query,
same reasoning as get_kpi_year_rows - see that method's docstring) and the
same 70%/90% on-track/near-target thresholds already established in
dashboard_service.py, so a KPI's status here always agrees with what the
org-wide Dashboard would call it for the same indicator/month.
"""
import logging
import uuid
from collections import defaultdict
from datetime import date, datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.custom_exceptions import AppException
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.department_dashboard import (
    AlertItemOut,
    AnnualTargetProgressOut,
    ComparisonItemOut,
    DepartmentDashboardOut,
    DepartmentFilterOptionsOut,
    DepartmentListResponse,
    DepartmentOut,
    FundingSummaryCardOut,
    HeatmapCellOut,
    HeatmapRowOut,
    KpiOverviewRowOut,
    MonthlyTrendPointOut,
    ParameterPerformanceItemOut,
    RecentActivityItemOut,
)

logger = logging.getLogger("groundpulse")

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_TO_INDEX = {name: i + 1 for i, name in enumerate(MONTHS)}

# Same cutoffs as dashboard_service.py's ON_TRACK_THRESHOLD/NEAR_TARGET_THRESHOLD -
# kept as separate constants (not a shared import) since the two dashboards
# are independently maintained pages that happen to agree on this value today.
ON_TRACK_THRESHOLD = 70.0
NEAR_TARGET_THRESHOLD = 90.0

PALETTE = ["#5575f2", "#1c5e59", "#df92eb", "#f2a154", "#e15554", "#4d9de0"]

UNIT_LABELS = {"EURO": "EUR", "COUNT": "", "PERCENT": "%", "DAYS": "Days", "TEXT": ""}

ACTIVITY_EVENT_TYPES = ["KPI_CREATED", "KPI_UPDATED", "KPI_DELETED", "KPI_MONTH_UPDATED", "KPI_IMPORT_COMPLETED"]
ACTIVITY_ACTION_TEXT = {
    "KPI_CREATED": "created a new KPI",
    "KPI_UPDATED": "updated a KPI's settings",
    "KPI_DELETED": "deleted a KPI",
    "KPI_MONTH_UPDATED": "updated KPI figures",
    "KPI_IMPORT_COMPLETED": "imported KPI data via Excel",
}


def _color_for(index: int) -> str:
    return PALETTE[index % len(PALETTE)]


def _status_for(pct: float | None) -> str | None:
    if pct is None:
        return None
    if pct >= NEAR_TARGET_THRESHOLD:
        return "On Target"
    if pct >= ON_TRACK_THRESHOLD:
        return "Near Target"
    return "Below Target"


def _heatmap_status(pct: float | None) -> str:
    # Matches PerformanceHeatmap.tsx's actual legend exactly: On Target
    # (>100%), At Risk (80-99%), Below Target (<80%) - NOT the 70/90
    # thresholds used elsewhere in this file for _status_for/alerts,
    # which is a different, unrelated cutoff for a different section.
    if pct is None:
        return "below-target"  # see schemas/department_dashboard.py docstring - no "no data" state in the frontend type
    if pct > 100:
        return "on-target"
    if pct >= 80:
        return "at-risk"
    return "below-target"


def _format_amount(value: Decimal | float, unit: str) -> str:
    suffix = UNIT_LABELS.get(unit, "")
    if unit == "PERCENT":
        return f"{float(value):,.1f}{suffix}"
    formatted = f"{float(value):,.0f}"
    return f"{formatted} {suffix}".strip()


class DepartmentDashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DashboardRepository(db)

    # ---------------------------------------------------------------- #
    # Department listing (populates the frontend's selector from the DB)
    # ---------------------------------------------------------------- #

    async def list_departments(self) -> DepartmentListResponse:
        departments = await self.repo.list_departments_full()
        return DepartmentListResponse(
            departments=[DepartmentOut(id=d.id, name=d.name) for d in departments]
        )

    # ---------------------------------------------------------------- #
    # Main dashboard
    # ---------------------------------------------------------------- #

    async def get_department_dashboard(
        self,
        department_id: uuid.UUID,
        year: int,
        month: str | None,
        parameter: str | None,
    ) -> DepartmentDashboardOut:
        department = await self.repo.get_department_by_id(department_id)
        if department is None:
            raise AppException("Department not found.", error_code="DEPARTMENT_NOT_FOUND", status_code=404)

        rows = await self.repo.get_department_year_rows(department_id, year)

        # Reshape into per-indicator records, same pattern as
        # DashboardService.get_overview - one pass, reused by every
        # section below instead of re-scanning `rows` per section.
        indicators: dict = {}
        all_parameters: set[str] = set()
        for row in rows:
            all_parameters.add(row.parameter)
            entry = indicators.setdefault(
                row.indicator_id,
                {
                    "parameter": row.parameter,
                    "indicator": row.indicator,
                    "annual_target": row.annual_target,
                    "measurement_unit": row.measurement_unit,
                    "months": {},
                },
            )
            if row.month is not None:
                entry["months"][row.month] = (row.actual_value, row.target_value, row.percentage)

        # `parameter` filter narrows the working set for every section -
        # applied here once, not re-checked in each builder.
        if parameter:
            indicators = {k: v for k, v in indicators.items() if v["parameter"] == parameter}

        month_idx = MONTH_TO_INDEX[month] if month else None
        latest_idx = month_idx or self._latest_populated_month(indicators) or datetime.now(timezone.utc).month

        summary_cards = self._build_summary_cards(indicators, latest_idx)
        monthly_trend = self._build_monthly_trend(indicators)
        parameter_performance = self._build_parameter_performance(indicators, latest_idx)
        kpi_overview_rows = self._build_kpi_overview_rows(indicators, latest_idx)
        heatmap_rows = self._build_heatmap_rows(indicators)
        annual_target_progress = self._build_annual_target_progress(indicators)
        monthly_comparison = self._build_monthly_comparison(indicators, latest_idx)
        kpi_alerts = self._build_kpi_alerts(indicators, latest_idx)
        recent_activity = await self._build_recent_activity(department.name)

        return DepartmentDashboardOut(
            department_id=department.id,
            department=department.name,
            year=year,
            month=month,
            parameter=parameter,
            summary_cards=summary_cards,
            monthly_trend=monthly_trend,
            parameter_performance=parameter_performance,
            kpi_overview_rows=kpi_overview_rows,
            heatmap_rows=heatmap_rows,
            annual_target_progress=annual_target_progress,
            monthly_comparison=monthly_comparison,
            kpi_alerts=kpi_alerts,
            recent_activity=recent_activity,
        )

    async def get_filter_options(self, department_id: uuid.UUID, year: int) -> DepartmentFilterOptionsOut:
        departments = await self.repo.list_departments_full()
        rows = await self.repo.get_department_year_rows(department_id, year)
        parameters = sorted({row.parameter for row in rows})
        years = await self.repo.get_distinct_years()
        current_year = datetime.now(timezone.utc).year
        if current_year not in years:
            years.append(current_year)
        years.sort()

        return DepartmentFilterOptionsOut(
            departments=[DepartmentOut(id=d.id, name=d.name) for d in departments],
            years=years,
            months=MONTHS,
            parameters=parameters,
        )

    # ------------------------------------------------------------------ #
    # Section builders
    # ------------------------------------------------------------------ #

    @staticmethod
    def _latest_populated_month(indicators: dict) -> int | None:
        months_with_data = {m for entry in indicators.values() for m in entry["months"]}
        return max(months_with_data) if months_with_data else None

    def _build_summary_cards(self, indicators: dict, latest_idx: int) -> list[FundingSummaryCardOut]:
        all_pcts = [
            float(pct) for entry in indicators.values() for (_a, _t, pct) in entry["months"].values() if pct is not None
        ]
        latest_pcts = [
            float(entry["months"][latest_idx][2])
            for entry in indicators.values()
            if latest_idx in entry["months"] and entry["months"][latest_idx][2] is not None
        ]
        prev_idx = latest_idx - 1 if latest_idx > 1 else None
        prev_pcts = [
            float(entry["months"][prev_idx][2])
            for entry in indicators.values()
            if prev_idx and prev_idx in entry["months"] and entry["months"][prev_idx][2] is not None
        ] if prev_idx else []

        overall = sum(all_pcts) / len(all_pcts) if all_pcts else None
        latest_avg = sum(latest_pcts) / len(latest_pcts) if latest_pcts else None
        prev_avg = sum(prev_pcts) / len(prev_pcts) if prev_pcts else None
        on_track = sum(1 for p in latest_pcts if p >= ON_TRACK_THRESHOLD)
        below = sum(1 for p in latest_pcts if p < ON_TRACK_THRESHOLD)

        change_label, change_direction, supporting = None, None, "No prior month to compare"
        if latest_avg is not None and prev_avg is not None:
            delta = latest_avg - prev_avg
            change_direction = "up" if delta >= 0 else "down"
            change_label = f"{'+' if delta >= 0 else ''}{delta:.1f}%"
            supporting = f"vs {prev_avg:.0f}% last month"

        return [
            FundingSummaryCardOut(
                title="Overall Achievement",
                value=f"{overall:.0f}%" if overall is not None else "—",
                change_label=change_label,
                change_direction=change_direction,
                supporting_text=supporting,
                icon="Target",
                tone="primary",
            ),
            FundingSummaryCardOut(
                title="KPIs On Track",
                value=str(on_track),
                supporting_text=f"out of {len(latest_pcts)} measured this month",
                icon="TrendingUp",
                tone="success",
            ),
            FundingSummaryCardOut(
                title="KPIs Below Target",
                value=str(below),
                supporting_text=f"out of {len(latest_pcts)} measured this month",
                icon="AlertCircle",
                tone="danger" if below > 0 else "neutral",
            ),
            FundingSummaryCardOut(
                title="Parameters Tracked",
                value=str(len({e["parameter"] for e in indicators.values()})),
                supporting_text=f"{len(indicators)} KPIs total",
                icon="CircleCheck",
                tone="neutral",
            ),
        ]

    @staticmethod
    def _build_monthly_trend(indicators: dict) -> list[MonthlyTrendPointOut]:
        points = []
        for month_idx, label in enumerate(MONTHS, start=1):
            actuals, targets = [], []
            for entry in indicators.values():
                row = entry["months"].get(month_idx)
                if row:
                    actual, target, _pct = row
                    if actual is not None:
                        actuals.append(float(actual))
                    if target is not None:
                        targets.append(float(target))
            points.append(
                MonthlyTrendPointOut(
                    month=label,
                    actual=round(sum(actuals), 2) if actuals else 0.0,
                    target=round(sum(targets), 2) if targets else 0.0,
                )
            )
        return points

    @staticmethod
    def _build_parameter_performance(indicators: dict, latest_idx: int) -> list[ParameterPerformanceItemOut]:
        param_pcts: dict = defaultdict(list)
        for entry in indicators.values():
            row = entry["months"].get(latest_idx)
            if row and row[2] is not None:
                param_pcts[entry["parameter"]].append(float(row[2]))

        results = [(param, sum(pcts) / len(pcts)) for param, pcts in param_pcts.items()]
        results.sort(key=lambda pair: pair[1], reverse=True)
        return [
            ParameterPerformanceItemOut(name=param, percentage=round(pct, 1), color=_color_for(i))
            for i, (param, pct) in enumerate(results)
        ]

    @staticmethod
    def _build_kpi_overview_rows(indicators: dict, latest_idx: int) -> list[KpiOverviewRowOut]:
        rows = []
        for entry in indicators.values():
            ytd_actual = sum(
                float(a) for month_idx, (a, _t, _p) in entry["months"].items() if month_idx <= latest_idx and a is not None
            )
            annual_target = float(entry["annual_target"]) if entry["annual_target"] is not None else 0.0

            latest_pct = entry["months"].get(latest_idx, (None, None, None))[2]
            prev_idx = latest_idx - 1 if latest_idx > 1 else None
            prev_pct = entry["months"].get(prev_idx, (None, None, None))[2] if prev_idx else None
            trend = "up" if (latest_pct is not None and prev_pct is not None and latest_pct >= prev_pct) else "down"
            achievement = float(latest_pct) if latest_pct is not None else 0.0

            rows.append(
                KpiOverviewRowOut(
                    indicator=entry["indicator"],
                    annual_target=annual_target,
                    current_ytd=round(ytd_actual, 2),
                    achievement=round(achievement, 1),
                    status=_status_for(achievement) or "Below Target",
                    trend=trend,
                )
            )
        rows.sort(key=lambda r: r.achievement)
        return rows

    @staticmethod
    def _build_heatmap_rows(indicators: dict) -> list[HeatmapRowOut]:
        rows = []
        for entry in indicators.values():
            cells = []
            for month_idx in range(1, 13):
                row = entry["months"].get(month_idx)
                pct = float(row[2]) if row and row[2] is not None else None
                status = _heatmap_status(pct)
                value_label = None
                if status != "on-target":
                    value_label = f"{pct:.0f}%" if pct is not None else "No data"
                cells.append(HeatmapCellOut(status=status, value_label=value_label))
            rows.append(HeatmapRowOut(indicator=entry["indicator"], cells=cells))
        return rows

    @staticmethod
    def _build_annual_target_progress(indicators: dict) -> AnnualTargetProgressOut:
        # See schemas/department_dashboard.py docstring: sums only the
        # indicators sharing the most common measurement_unit among
        # those in scope - mixing EUR + COUNT + DAYS into one number
        # would be meaningless.
        unit_counts: dict = defaultdict(int)
        for entry in indicators.values():
            unit_counts[entry["measurement_unit"]] += 1
        dominant_unit = max(unit_counts, key=unit_counts.get) if unit_counts else "COUNT"

        eoy_actual = Decimal(0)
        eoy_target = Decimal(0)
        for entry in indicators.values():
            if entry["measurement_unit"] != dominant_unit:
                continue
            annual_target = entry["annual_target"] or Decimal(0)
            default_monthly = annual_target / Decimal(12) if annual_target else Decimal(0)
            for month_idx in range(1, 13):
                row = entry["months"].get(month_idx)
                if row:
                    actual, target, _pct = row
                    eoy_actual += actual if actual is not None else Decimal(0)
                    eoy_target += target if target is not None else default_monthly
                else:
                    eoy_target += default_monthly

        pct = float(eoy_actual / eoy_target * 100) if eoy_target > 0 else 0.0
        remaining = eoy_target - eoy_actual

        today = date.today()
        year_end = date(today.year, 12, 31)
        days_left = max((year_end - today).days, 0) if today.year <= year_end.year else 0

        return AnnualTargetProgressOut(
            target_label=_format_amount(eoy_target, dominant_unit),
            current_label=_format_amount(eoy_actual, dominant_unit),
            percentage=round(pct, 1),
            remaining_label=_format_amount(max(remaining, Decimal(0)), dominant_unit),
            days_left_label=f"{days_left} Days",
        )

    @staticmethod
    def _build_monthly_comparison(indicators: dict, latest_idx: int) -> list[ComparisonItemOut]:
        prev_idx = latest_idx - 1 if latest_idx > 1 else None
        param_latest: dict = defaultdict(list)
        param_prev: dict = defaultdict(list)
        for entry in indicators.values():
            latest_row = entry["months"].get(latest_idx)
            if latest_row and latest_row[2] is not None:
                param_latest[entry["parameter"]].append(float(latest_row[2]))
            if prev_idx:
                prev_row = entry["months"].get(prev_idx)
                if prev_row and prev_row[2] is not None:
                    param_prev[entry["parameter"]].append(float(prev_row[2]))

        items = []
        for param in sorted(set(param_latest) & set(param_prev)):
            avg_latest = sum(param_latest[param]) / len(param_latest[param])
            avg_prev = sum(param_prev[param]) / len(param_prev[param])
            delta = avg_latest - avg_prev
            items.append(
                ComparisonItemOut(
                    label=param,
                    change_label=f"{'+' if delta >= 0 else ''}{delta:.1f}%",
                    direction="up" if delta >= 0 else "down",
                )
            )
        return items

    @staticmethod
    def _build_kpi_alerts(indicators: dict, latest_idx: int) -> list[AlertItemOut]:
        alerts = []
        for entry in indicators.values():
            row = entry["months"].get(latest_idx)
            pct = float(row[2]) if row and row[2] is not None else None
            if pct is None:
                continue
            if pct < ON_TRACK_THRESHOLD:
                alerts.append(
                    AlertItemOut(
                        id=f"below-{entry['indicator']}",
                        title=f"{entry['indicator']} is below target",
                        description=f"Currently at {pct:.0f}% against target this month.",
                        tone="danger",
                    )
                )
            elif pct < NEAR_TARGET_THRESHOLD:
                alerts.append(
                    AlertItemOut(
                        id=f"near-{entry['indicator']}",
                        title=f"{entry['indicator']} is near target",
                        description=f"Currently at {pct:.0f}% - close to the 90% threshold.",
                        tone="warning",
                    )
                )
            elif pct >= 100:
                alerts.append(
                    AlertItemOut(
                        id=f"exceeded-{entry['indicator']}",
                        title=f"{entry['indicator']} exceeded target",
                        description=f"Currently at {pct:.0f}% of target this month.",
                        tone="success",
                    )
                )
        return alerts

    async def _build_recent_activity(self, department_name: str, limit: int = 10) -> list[RecentActivityItemOut]:
        # NOTE: AuditLog entries aren't tagged with a department today
        # (see audit_log.py - just event_type/description/user_id), so
        # this can't filter server-side to "activity for this
        # department" without a schema change. It's filtered here by
        # substring match against the free-text `description` field
        # (which KpiService already writes as e.g. "Updated KPI 'X' ...")
        # - good enough to keep the feed relevant, but not a hard
        # guarantee the way a real department_id column would be.
        audit_repo = AuditLogRepository(self.db)
        entries = await audit_repo.list_recent(limit=limit * 3, event_types=ACTIVITY_EVENT_TYPES)

        matched = [e for e in entries if e.description and department_name.lower() in e.description.lower()]
        chosen = matched[:limit] if matched else entries[:limit]

        return [
            RecentActivityItemOut(
                id=entry.id,
                actor=getattr(entry, "actor_name", None) or "Unknown user",
                action=ACTIVITY_ACTION_TEXT.get(entry.event_type, entry.event_type),
                timestamp=entry.created_at,
            )
            for entry in chosen
        ]