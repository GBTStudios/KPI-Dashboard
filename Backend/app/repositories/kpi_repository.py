"""Data access for the KPI module. No business logic or percentage
calculation here - that lives in app/services/kpi_service.py, same split
as UserRepository/AdminUserService."""
import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.department import Department
from app.models.kpi_indicator import KpiIndicator
from app.models.kpi_monthly_value import KpiMonthlyValue
from app.models.parameter import Parameter


class KpiRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    # ---------------------------------------------------------------- #
    # Departments / Parameters (get-or-create, backs the hierarchy)
    # ---------------------------------------------------------------- #

    async def get_or_create_department(self, name: str) -> Department:
        result = await self.db.execute(select(Department).where(Department.name == name))
        department = result.scalar_one_or_none()
        if department is None:
            department = Department(name=name)
            self.db.add(department)
            await self.db.flush()
        return department

    async def get_or_create_parameter(self, department_id: uuid.UUID, name: str) -> Parameter:
        result = await self.db.execute(
            select(Parameter).where(Parameter.department_id == department_id, Parameter.name == name)
        )
        parameter = result.scalar_one_or_none()
        if parameter is None:
            parameter = Parameter(department_id=department_id, name=name)
            self.db.add(parameter)
            await self.db.flush()
        return parameter

    async def list_departments(self) -> list[Department]:
        result = await self.db.execute(select(Department).order_by(Department.name))
        return list(result.scalars().all())

    async def list_parameters(self, department_id: uuid.UUID | None = None) -> list[Parameter]:
        query = select(Parameter).order_by(Parameter.name)
        if department_id is not None:
            query = query.where(Parameter.department_id == department_id)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    # ---------------------------------------------------------------- #
    # KPI Indicators
    # ---------------------------------------------------------------- #

    def _base_indicator_query(self):
        # NOTE: this still eagerly loads monthly_values for ALL years, not
        # just the one being requested - KpiIndicator.monthly_values has
        # no year filter built into the relationship itself. Filtering to
        # the requested year happens in KpiService._to_out. Fine at this
        # data size (a handful of years x 12 months per indicator); if
        # that ever grows large enough to matter, this would need a
        # year-scoped relationship or a separate query instead of
        # selectinload here.
        return select(KpiIndicator).options(
            selectinload(KpiIndicator.parameter).selectinload(Parameter.department),
            selectinload(KpiIndicator.monthly_values),
        )

    async def get_indicator_by_id(self, indicator_id: uuid.UUID) -> KpiIndicator | None:
        result = await self.db.execute(self._base_indicator_query().where(KpiIndicator.id == indicator_id))
        return result.scalar_one_or_none()

    def add_indicator(self, indicator: KpiIndicator) -> None:
        self.db.add(indicator)

    async def flush(self) -> None:
        await self.db.flush()

    async def list_indicators(
        self,
        page: int = 1,
        page_size: int = 10,
        department: str | None = None,
        parameter: str | None = None,
        indicator: str | None = None,
    ) -> tuple[list[KpiIndicator], int]:
        query = self._base_indicator_query().join(KpiIndicator.parameter).join(Parameter.department)
        count_query = (
            select(func.count())
            .select_from(KpiIndicator)
            .join(Parameter, KpiIndicator.parameter_id == Parameter.id)
            .join(Department, Parameter.department_id == Department.id)
        )

        if department:
            query = query.where(Department.name == department)
            count_query = count_query.where(Department.name == department)
        if parameter:
            query = query.where(Parameter.name == parameter)
            count_query = count_query.where(Parameter.name == parameter)
        if indicator:
            like = f"%{indicator.strip()}%"
            query = query.where(KpiIndicator.indicator_name.ilike(like))
            count_query = count_query.where(KpiIndicator.indicator_name.ilike(like))

        total = (await self.db.execute(count_query)).scalar_one()

        query = query.order_by(KpiIndicator.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items = (await self.db.execute(query)).unique().scalars().all()

        return list(items), total

    async def delete_indicator(self, indicator: KpiIndicator) -> None:
        await self.db.delete(indicator)

    # ---------------------------------------------------------------- #
    # Monthly values - one row per (indicator, year, month)
    # ---------------------------------------------------------------- #

    async def get_monthly_value(self, indicator_id: uuid.UUID, year: int, month: int) -> KpiMonthlyValue | None:
        result = await self.db.execute(
            select(KpiMonthlyValue).where(
                KpiMonthlyValue.indicator_id == indicator_id,
                KpiMonthlyValue.year == year,
                KpiMonthlyValue.month == month,
            )
        )
        return result.scalar_one_or_none()

    def add_monthly_value(self, monthly_value: KpiMonthlyValue) -> None:
        self.db.add(monthly_value)