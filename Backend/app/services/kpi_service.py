"""Business logic for the KPI module.

Percentage is ALWAYS computed here - (actual_value / target_value) * 100 -
and never trusted from the client. See update_month.

`year`: list_kpis/get_kpi/update_month all take an explicit year now
(threaded down from the `year` query param on the routes - see
app/api/v1/kpis/routes.py). _to_out uses it to pick which year's
monthly_values to include in the response, since an indicator's eagerly-
loaded monthly_values relationship spans every year, not just one.
"""
import logging
import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.custom_exceptions import KpiIndicatorNotFoundException
from app.models.kpi_indicator import KpiIndicator
from app.models.kpi_monthly_value import KpiMonthlyValue
from app.models.user import User
from app.repositories.audit_log_repository import AuditLogRepository
from app.repositories.kpi_repository import KpiRepository
from app.schemas.kpi import (
    INDEX_TO_MONTH,
    MONTH_TO_INDEX,
    CreateKpiRequest,
    DepartmentOut,
    KpiOut,
    MonthlyValueOut,
    ParameterOut,
    UpdateKpiRequest,
    UpdateMonthRequest,
)

logger = logging.getLogger("groundpulse")


def current_year() -> int:
    """Single source of truth for 'what year is it' across the KPI module -
    used as the default whenever a route's `year` query param is omitted."""
    return datetime.now(timezone.utc).year


class KpiService:
    def __init__(self, db: AsyncSession, actor: User, ip_address: str | None = None, user_agent: str | None = None):
        self.db = db
        self.actor = actor
        self.repo = KpiRepository(db)
        self.audit = AuditLogRepository(db)
        self.ip_address = ip_address
        self.user_agent = user_agent

    # ---------------------------------------------------------------- #
    # Lookups
    # ---------------------------------------------------------------- #

    async def list_departments(self) -> list[DepartmentOut]:
        departments = await self.repo.list_departments()
        return [DepartmentOut.model_validate(d) for d in departments]

    async def list_parameters(self, department_id: uuid.UUID | None) -> list[ParameterOut]:
        parameters = await self.repo.list_parameters(department_id)
        return [ParameterOut.model_validate(p) for p in parameters]

    # ---------------------------------------------------------------- #
    # KPI Indicators
    # ---------------------------------------------------------------- #

    async def create_kpi(self, payload: CreateKpiRequest, year: int) -> KpiOut:
        department = await self.repo.get_or_create_department(payload.department)
        parameter = await self.repo.get_or_create_parameter(department.id, payload.parameter)

        indicator = KpiIndicator(
            parameter_id=parameter.id,
            indicator_name=payload.indicator_name,
            annual_target=Decimal(str(payload.annual_target)),
            target_type=payload.target_type,
            measurement_unit=payload.measurement_unit,
            person_in_charge=payload.person_in_charge,
        )
        self.repo.add_indicator(indicator)
        await self.repo.flush()

        self.audit.add(
            "KPI_CREATED", user_id=self.actor.id,
            description=f"Created KPI '{payload.indicator_name}' under {payload.department}/{payload.parameter}",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )
        logger.info("KPI indicator created id=%s by=%s", indicator.id, self.actor.id)

        # Reload with relationships eagerly loaded for a consistent response shape.
        indicator = await self.repo.get_indicator_by_id(indicator.id)
        return self._to_out(indicator, year)

    async def list_kpis(
        self,
        page: int,
        page_size: int,
        department: str | None,
        parameter: str | None,
        indicator: str | None,
        year: int,
    ) -> tuple[list[KpiOut], int]:
        items, total = await self.repo.list_indicators(page, page_size, department, parameter, indicator)
        return [self._to_out(item, year) for item in items], total

    async def get_kpi(self, indicator_id: uuid.UUID, year: int) -> KpiOut:
        indicator = await self.repo.get_indicator_by_id(indicator_id)
        if indicator is None:
            raise KpiIndicatorNotFoundException()
        return self._to_out(indicator, year)

    async def update_kpi(self, indicator_id: uuid.UUID, payload: UpdateKpiRequest, year: int) -> KpiOut:
        indicator = await self.repo.get_indicator_by_id(indicator_id)
        if indicator is None:
            raise KpiIndicatorNotFoundException()

        if payload.indicator_name is not None:
            indicator.indicator_name = payload.indicator_name
        if payload.annual_target is not None:
            indicator.annual_target = Decimal(str(payload.annual_target))
        if payload.target_type is not None:
            indicator.target_type = payload.target_type
        if payload.measurement_unit is not None:
            indicator.measurement_unit = payload.measurement_unit
        if payload.clear_person_in_charge:
            indicator.person_in_charge = None
        elif payload.person_in_charge is not None:
            indicator.person_in_charge = payload.person_in_charge

        await self.repo.flush()

        self.audit.add(
            "KPI_UPDATED", user_id=self.actor.id,
            description=f"Updated KPI '{indicator.indicator_name}'",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )
        logger.info("KPI indicator updated id=%s by=%s", indicator.id, self.actor.id)

        indicator = await self.repo.get_indicator_by_id(indicator_id)
        return self._to_out(indicator, year)

    async def delete_kpi(self, indicator_id: uuid.UUID) -> None:
        indicator = await self.repo.get_indicator_by_id(indicator_id)
        if indicator is None:
            raise KpiIndicatorNotFoundException()

        self.audit.add(
            "KPI_DELETED", user_id=self.actor.id,
            description=f"Deleted KPI '{indicator.indicator_name}'",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )
        logger.warning("KPI indicator deleted id=%s by=%s", indicator.id, self.actor.id)

        await self.repo.delete_indicator(indicator)

    # ---------------------------------------------------------------- #
    # Monthly values
    # ---------------------------------------------------------------- #

    async def update_month(
        self, indicator_id: uuid.UUID, month_name: str, year: int, payload: UpdateMonthRequest
    ) -> KpiOut:
        indicator = await self.repo.get_indicator_by_id(indicator_id)
        if indicator is None:
            raise KpiIndicatorNotFoundException()

        month_index = MONTH_TO_INDEX[month_name]
        monthly_value = await self.repo.get_monthly_value(indicator_id, year, month_index)

        if monthly_value is None:
            # No auto-fill: every month's target is whatever the user
            # actually typed in, nothing computed from annual_target.
            # Left as None if the user hasn't entered a target for this
            # month yet - percentage stays None too until they do (see
            # _calculate_percentage).
            monthly_value = KpiMonthlyValue(
                indicator_id=indicator_id,
                year=year,
                month=month_index,
                target_value=Decimal(str(payload.target_value)) if payload.target_value is not None else None,
                actual_value=Decimal(str(payload.actual_value)) if payload.actual_value is not None else None,
            )
            self.repo.add_monthly_value(monthly_value)
        else:
            if payload.target_value is not None:
                monthly_value.target_value = Decimal(str(payload.target_value))
            if payload.actual_value is not None:
                monthly_value.actual_value = Decimal(str(payload.actual_value))
            elif "actual_value" in payload.model_fields_set and payload.actual_value is None:
                # Explicit clear (e.g. field emptied in the UI) vs. simply omitted.
                monthly_value.actual_value = None

        monthly_value.percentage = self._calculate_percentage(monthly_value.actual_value, monthly_value.target_value)

        await self.repo.flush()

        self.audit.add(
            "KPI_MONTH_UPDATED", user_id=self.actor.id,
            description=f"Updated {month_name} {year} for KPI '{indicator.indicator_name}': "
                        f"actual={monthly_value.actual_value} target={monthly_value.target_value}",
            ip_address=self.ip_address, user_agent=self.user_agent,
        )
        logger.info(
            "KPI month updated indicator_id=%s year=%s month=%s by=%s",
            indicator_id, year, month_name, self.actor.id,
        )

        indicator = await self.repo.get_indicator_by_id(indicator_id)
        return self._to_out(indicator, year)

    # ---------------------------------------------------------------- #
    # Internal helpers
    # ---------------------------------------------------------------- #

    @staticmethod
    def _calculate_percentage(actual: Decimal | None, target: Decimal | None) -> Decimal | None:
        """The one and only place percentage is computed. Never accept this
        value from the client - see UpdateMonthRequest, which has no
        percentage field at all."""
        if actual is None or target is None or target == 0:
            return None
        return round((actual / target) * Decimal(100), 2)

    @staticmethod
    def _to_out(indicator: KpiIndicator, year: int) -> KpiOut:
        parameter = indicator.parameter
        department = parameter.department
        # indicator.monthly_values holds every year that's ever been
        # touched (see KpiRepository._base_indicator_query's note) -
        # filter down to just the requested year here.
        monthly_values = [
            MonthlyValueOut(
                month=INDEX_TO_MONTH[mv.month],
                actual_value=float(mv.actual_value) if mv.actual_value is not None else None,
                target_value=float(mv.target_value) if mv.target_value is not None else None,
                percentage=float(mv.percentage) if mv.percentage is not None else None,
            )
            for mv in sorted(indicator.monthly_values, key=lambda v: v.month)
            if mv.year == year
        ]
        return KpiOut(
            id=indicator.id,
            department=department.name,
            parameter=parameter.name,
            indicator_name=indicator.indicator_name,
            annual_target=float(indicator.annual_target) if indicator.annual_target is not None else None,
            target_type=indicator.target_type,
            measurement_unit=indicator.measurement_unit,
            person_in_charge=indicator.person_in_charge,
            year=year,
            monthly_values=monthly_values,
            created_at=indicator.created_at,
            updated_at=indicator.updated_at,
        )