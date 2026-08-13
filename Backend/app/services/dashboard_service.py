"""Business logic for the Dashboard module - see DashboardRepository's
docstring for why this does one query + Python-side aggregation instead
of six separate GROUP BY queries.

Every threshold/convention below is reused from somewhere else in this
codebase rather than invented fresh:
  - 90% / 70% on-track/near/below cutoffs: same as kpi-pct-good/warn/bad
    in KpiEntry.tsx / KpiUpdate.tsx.
  - Annual-progress formula (sum actual, treating missing months as 0,
    over sum target, treating missing months as annual_target/12):
    identical to getEndOfYearActual/getEndOfYearTarget in
    frontend/src/types/kpi.ts, so these numbers agree with what
    KpiEntry/KpiUpdate already show for the same indicator/year.
  - percentage itself is never recomputed here - always the stored
    KpiMonthlyValue.percentage from KpiService._calculate_percentage.
"""
import logging
from collections import defaultdict
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.dashboard_repository import DashboardRepository
from app.schemas.dashboard import (
    AnnualProgressItemOut,
    DashboardFilterOptionsOut,
    DashboardOverviewOut,
    DepartmentPerformanceOut,
    KpiTableRowOut,
    MapPerformancePointOut,
    RecentActivityItemOut,
    SummaryCardsOut,
)

logger = logging.getLogger("groundpulse")

MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_TO_INDEX = {name: i + 1 for i, name in enumerate(MONTHS)}

# Cycled deterministically by sort position - purely presentational, not
# derived from any data. Same 3 colors the mock data already used, plus
# a couple more so a longer department/indicator list doesn't repeat too
# quickly.
PALETTE = ["#5575f2", "#1c5e59", "#df92eb", "#f2a154", "#e15554", "#4d9de0"]

ON_TRACK_THRESHOLD = 70.0
NEAR_TARGET_THRESHOLD = 90.0

# Audit event types the Dashboard's Recent Activity feed cares about -
# these match AuditLog.event_type (see audit_log_repository.py: add()
# and list_recent() both use `event_type`, not `event_code`).
ACTIVITY_EVENT_CODES = ["KPI_CREATED", "KPI_UPDATED", "KPI_DELETED", "KPI_MONTH_UPDATED", "KPI_IMPORT_UPLOADED"]
ACTIVITY_ACTION_TEXT = {
    "KPI_CREATED": "created a new KPI",
    "KPI_UPDATED": "updated a KPI's settings",
    "KPI_DELETED": "deleted a KPI",
    "KPI_MONTH_UPDATED": "updated KPI figures",
    "KPI_IMPORT_UPLOADED": "imported KPI data via Excel",
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


def _to_float(value: Decimal | None) -> float | None:
    return float(value) if value is not None else None


class DashboardService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DashboardRepository(db)

    async def get_overview(
        self,
        year: int,
        month_a: str,
        month_b: str,
        department: str | None,
        kpi_table_limit: int,
    ) -> DashboardOverviewOut:
        rows = await self.repo.get_kpi_year_rows(year, department)

        # ------------------------------------------------------------- #
        # Reshape the flat rows into per-indicator records once, reused
        # by every section below instead of re-scanning `rows` per card.
        # ------------------------------------------------------------- #
        indicators: dict = {}  # indicator_id -> {department, indicator, annual_target, months: {1..12: (actual, target, pct)}}
        for row in rows:
            entry = indicators.setdefault(
                row.indicator_id,
                {
                    "department": row.department,
                    "indicator": row.indicator,
                    "annual_target": row.annual_target,
                    "months": {},
                },
            )
            if row.month is not None:
                entry["months"][row.month] = (row.actual_value, row.target_value, row.percentage)

        month_a_idx = MONTH_TO_INDEX[month_a]
        month_b_idx = MONTH_TO_INDEX[month_b]

        summary = self._build_summary(indicators, month_a_idx, month_b_idx)
        map_performance = self._build_map_performance(indicators)
        department_performance = self._build_department_performance(indicators, month_b_idx)
        kpi_table = self._build_kpi_table(indicators, month_a_idx, month_b_idx, kpi_table_limit)
        annual_progress = self._build_annual_progress(indicators)
        recent_activity = await self._build_recent_activity()
        filter_options = await self._build_filter_options()

        return DashboardOverviewOut(
            year=year,
            month_a=month_a,
            month_b=month_b,
            department_filter=department,
            summary=summary,
            map_performance=map_performance,
            department_performance=department_performance,
            kpi_table=kpi_table,
            annual_progress=annual_progress,
            recent_activity=recent_activity,
            filter_options=filter_options,
        )

    # ------------------------------------------------------------------ #
    # Section builders
    # ------------------------------------------------------------------ #

    @staticmethod
    def _build_summary(indicators: dict, month_a_idx: int, month_b_idx: int) -> SummaryCardsOut:
        all_pcts: list[float] = []
        month_b_pcts: list[float] = []
        dept_month_a: dict = defaultdict(list)
        dept_month_b: dict = defaultdict(list)

        for entry in indicators.values():
            for _actual, _target, pct in entry["months"].values():
                if pct is not None:
                    all_pcts.append(float(pct))

            mb = entry["months"].get(month_b_idx)
            if mb and mb[2] is not None:
                month_b_pcts.append(float(mb[2]))

            ma_row = entry["months"].get(month_a_idx)
            mb_row = entry["months"].get(month_b_idx)
            if ma_row and ma_row[2] is not None:
                dept_month_a[entry["department"]].append(float(ma_row[2]))
            if mb_row and mb_row[2] is not None:
                dept_month_b[entry["department"]].append(float(mb_row[2]))

        overall_pct = sum(all_pcts) / len(all_pcts) if all_pcts else None
        on_track = sum(1 for p in month_b_pcts if p >= ON_TRACK_THRESHOLD)
        below_target = sum(1 for p in month_b_pcts if p < ON_TRACK_THRESHOLD)

        comparable_depts = set(dept_month_a) & set(dept_month_b)
        improving = 0
        for dept in comparable_depts:
            avg_a = sum(dept_month_a[dept]) / len(dept_month_a[dept])
            avg_b = sum(dept_month_b[dept]) / len(dept_month_b[dept])
            if avg_b > avg_a:
                improving += 1

        return SummaryCardsOut(
            overall_achievement_pct=round(overall_pct, 1) if overall_pct is not None else None,
            kpis_on_track=on_track,
            kpis_below_target=below_target,
            kpis_total=len(month_b_pcts),
            departments_improving=improving,
            departments_total=len(comparable_depts),
        )

    @staticmethod
    def _build_map_performance(indicators: dict) -> list[MapPerformancePointOut]:
        points = []
        for month_idx, month_label in enumerate(MONTHS, start=1):
            pcts = [
                float(entry["months"][month_idx][2])
                for entry in indicators.values()
                if month_idx in entry["months"] and entry["months"][month_idx][2] is not None
            ]
            actual = round(sum(pcts) / len(pcts), 1) if pcts else None
            points.append(MapPerformancePointOut(month=month_label, actual=actual, target=100.0))
        return points

    @staticmethod
    def _build_department_performance(indicators: dict, month_b_idx: int) -> list[DepartmentPerformanceOut]:
        dept_pcts: dict = defaultdict(list)
        for entry in indicators.values():
            row = entry["months"].get(month_b_idx)
            if row and row[2] is not None:
                dept_pcts[entry["department"]].append(float(row[2]))

        # Departments with no data this month are omitted, not shown at 0%
        # - see schemas/dashboard.py's docstring on this field.
        results = [
            (dept, sum(pcts) / len(pcts))
            for dept, pcts in dept_pcts.items()
        ]
        results.sort(key=lambda pair: pair[1], reverse=True)

        return [
            DepartmentPerformanceOut(department=dept, percentage=round(pct, 1), color=_color_for(i))
            for i, (dept, pct) in enumerate(results)
        ]

    @staticmethod
    def _build_kpi_table(
        indicators: dict, month_a_idx: int, month_b_idx: int, limit: int
    ) -> list[KpiTableRowOut]:
        table_rows = []
        for entry in indicators.values():
            a_row = entry["months"].get(month_a_idx)
            b_row = entry["months"].get(month_b_idx)
            a_pct = float(a_row[2]) if a_row and a_row[2] is not None else None
            b_pct = float(b_row[2]) if b_row and b_row[2] is not None else None
            change = (b_pct - a_pct) if a_pct is not None and b_pct is not None else None

            table_rows.append(
                KpiTableRowOut(
                    indicator=entry["indicator"],
                    department=entry["department"],
                    month_a_value=round(a_pct, 1) if a_pct is not None else None,
                    month_b_value=round(b_pct, 1) if b_pct is not None else None,
                    change=round(change, 1) if change is not None else None,
                    status=_status_for(b_pct),
                )
            )

        # Rows with no comparable change sort last, not first (a None
        # "swing" isn't a 0 swing - it's unranked).
        table_rows.sort(key=lambda r: (r.change is None, -abs(r.change) if r.change is not None else 0))
        return table_rows[:limit]

    @staticmethod
    def _build_annual_progress(indicators: dict) -> list[AnnualProgressItemOut]:
        items = []
        for entry in indicators.values():
            annual_target = entry["annual_target"]
            default_monthly_target = annual_target / Decimal(12) if annual_target else Decimal(0)

            eoy_actual = Decimal(0)
            eoy_target = Decimal(0)
            for month_idx in range(1, 13):
                row = entry["months"].get(month_idx)
                if row:
                    actual, target, _pct = row
                    eoy_actual += actual if actual is not None else Decimal(0)
                    eoy_target += target if target is not None else default_monthly_target
                else:
                    eoy_target += default_monthly_target

            pct = float(eoy_actual / eoy_target * 100) if eoy_target > 0 else None
            items.append((entry["indicator"], pct))

        items.sort(key=lambda pair: (pair[1] is None, -(pair[1] or 0)))
        return [
            AnnualProgressItemOut(
                label=label, percentage=round(pct, 1) if pct is not None else None, color=_color_for(i)
            )
            for i, (label, pct) in enumerate(items)
        ]

    async def _build_recent_activity(self, limit: int = 10) -> list[RecentActivityItemOut]:
        # See audit_log_repository.py - list_recent() needs to be present
        # on AuditLogRepository before this works; guarded so the rest of
        # the dashboard still renders if it's not there yet.
        try:
            from app.repositories.audit_log_repository import AuditLogRepository

            audit_repo = AuditLogRepository(self.db)
            entries = await audit_repo.list_recent(limit=limit, event_types=ACTIVITY_EVENT_CODES)
        except AttributeError:
            logger.warning("AuditLogRepository.list_recent() not implemented yet - Recent Activity will be empty.")
            return []

        return [
            RecentActivityItemOut(
                id=entry.id,
                # list_recent() stashes the joined user's name directly on
                # each entry as `.actor_name` (see AuditLogRepository) -
                # there is no `.user` relationship object to reach through.
                actor=entry.actor_name,
                # AuditLog's column is `event_type`, not `event_code`
                # (see audit_log_repository.py: add() / list_recent()).
                action=ACTIVITY_ACTION_TEXT.get(entry.event_type, entry.event_type),
                timestamp=entry.created_at,
            )
            for entry in entries
        ]

    async def _build_filter_options(self) -> DashboardFilterOptionsOut:
        from datetime import datetime, timezone

        years = await self.repo.get_distinct_years()
        current_year = datetime.now(timezone.utc).year
        if current_year not in years:
            years.append(current_year)
        years.sort()

        departments = await self.repo.get_distinct_departments()

        return DashboardFilterOptionsOut(years=years, months=MONTHS, departments=departments)