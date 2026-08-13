"""Data access for the Dashboard module.

DESIGN CHOICE: get_kpi_year_rows() below is ONE query that returns a flat
row per (indicator, month-with-a-value-or-NULL) for the whole year, via a
LEFT JOIN from kpi_indicators outward - not six separate GROUP BY queries
per dashboard section. All the grouping/averaging for summary cards, the
MAP chart, department performance, the KPI table, and annual progress
happens in Python from this one result set (see DashboardService).

Why: those six sections need different group-bys (by month, by
department, by indicator, by nothing) over the SAME underlying rows: at
this data scale (one org's KPI set - tens to low hundreds of indicators
x 12 months) one query + in-memory aggregation is simpler to get right
and just as fast as six DB round trips, and it's trivially "not N+1"
since it's exactly 1 query regardless of indicator count. If this data
volume grows by orders of magnitude, the summary-card and MAP-chart
aggregations in particular are straightforward to move into SQL
GROUP BY/AVG queries instead - nothing else about the response shape
would need to change.

The LEFT JOIN keeps `KpiMonthlyValue.year == year` INSIDE the join
condition (not a WHERE clause) specifically so indicators with zero rows
for that year still appear once, with month/actual/target/percentage
all NULL - required so "no data yet" is visible instead of silently
disappearing (see the module docstring in schemas/dashboard.py on why
None != 0 throughout this module).
"""
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.models.kpi_indicator import KpiIndicator
from app.models.kpi_monthly_value import KpiMonthlyValue
from app.models.parameter import Parameter


class DashboardRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_kpi_year_rows(self, year: int, department: str | None = None):
        """Returns raw SQLAlchemy Row objects with columns: department,
        indicator_id, indicator, annual_target, month (1-12 or None),
        actual_value, target_value, percentage (all None together when
        an indicator has no row for a given month)."""
        stmt = (
            select(
                Department.name.label("department"),
                KpiIndicator.id.label("indicator_id"),
                KpiIndicator.indicator_name.label("indicator"),
                KpiIndicator.annual_target.label("annual_target"),
                KpiMonthlyValue.month.label("month"),
                KpiMonthlyValue.actual_value.label("actual_value"),
                KpiMonthlyValue.target_value.label("target_value"),
                KpiMonthlyValue.percentage.label("percentage"),
            )
            .select_from(KpiIndicator)
            .join(Parameter, KpiIndicator.parameter_id == Parameter.id)
            .join(Department, Parameter.department_id == Department.id)
            .outerjoin(
                KpiMonthlyValue,
                and_(
                    KpiMonthlyValue.indicator_id == KpiIndicator.id,
                    KpiMonthlyValue.year == year,
                ),
            )
        )
        if department:
            stmt = stmt.where(Department.name == department)

        result = await self.db.execute(stmt)
        return result.all()

    async def get_distinct_years(self) -> list[int]:
        stmt = select(KpiMonthlyValue.year).distinct().order_by(KpiMonthlyValue.year)
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]

    async def get_distinct_departments(self) -> list[str]:
        stmt = select(Department.name).distinct().order_by(Department.name)
        result = await self.db.execute(stmt)
        return [row[0] for row in result.all()]
