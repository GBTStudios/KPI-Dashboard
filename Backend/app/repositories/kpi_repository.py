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
        """Matches case-insensitively (collapsing incoming whitespace
        first) so "PROGRAM ", "Programs", "programs" all resolve to the
        same row instead of creating a new Department per casing variant
        - this was previously an exact Department.name == name match,
        which is why imports using different casing across files created
        real duplicates in the DB. The FIRST display name ever inserted
        for a given normalized name is what's kept; a later import using
        different casing does not rename the existing row."""
        normalized = " ".join(name.strip().split())
        result = await self.db.execute(
            select(Department).where(func.lower(Department.name) == normalized.lower())
        )
        department = result.scalar_one_or_none()
        if department is None:
            department = Department(name=normalized)
            self.db.add(department)
            await self.db.flush()
        return department

    async def get_or_create_parameter(self, department_id: uuid.UUID, name: str) -> Parameter:
        """Same case-insensitive/whitespace-normalized matching as
        get_or_create_department, and for the same reason - a Parameter
        name re-typed with different casing across two imports should
        resolve to the existing row, not create a sibling."""
        normalized = " ".join(name.strip().split())
        result = await self.db.execute(
            select(Parameter).where(
                Parameter.department_id == department_id,
                func.lower(Parameter.name) == normalized.lower(),
            )
        )
        parameter = result.scalar_one_or_none()
        if parameter is None:
            parameter = Parameter(department_id=department_id, name=normalized)
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

    async def get_indicator_by_name(self, parameter_id: uuid.UUID, indicator_name: str) -> KpiIndicator | None:
        result = await self.db.execute(
            self._base_indicator_query().where(
                KpiIndicator.parameter_id == parameter_id, KpiIndicator.indicator_name == indicator_name
            )
        )
        return result.scalar_one_or_none()

    async def get_or_create_indicator(
        self,
        parameter_id: uuid.UUID,
        indicator_name: str,
        annual_target,
        target_type: str,
        measurement_unit: str,
        person_in_charge: str | None,
    ) -> tuple[KpiIndicator, bool]:
        """Used by the import module (see ImportService). Returns
        (indicator, created). On a hit, the existing indicator's metadata
        (annual_target, target_type, measurement_unit, person_in_charge)
        is intentionally left untouched - only new indicators get these
        values from the imported row. This avoids 12 different monthly
        rows for the same indicator silently overwriting each other's
        idea of what the annual target should be."""
        existing = await self.get_indicator_by_name(parameter_id, indicator_name)
        if existing is not None:
            return existing, False

        indicator = KpiIndicator(
            parameter_id=parameter_id,
            indicator_name=indicator_name,
            annual_target=annual_target,
            target_type=target_type,
            measurement_unit=measurement_unit,
            person_in_charge=person_in_charge,
        )
        self.db.add(indicator)
        await self.db.flush()
        return indicator, True

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