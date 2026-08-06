"""KPI module schemas.

Percentage is never accepted from the client on any request schema below -
it is always computed server-side in KpiService and only ever appears on
response schemas. See KpiService._calculate_percentage.
"""
import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

MONTHS: list[str] = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
MONTH_TO_INDEX: dict[str, int] = {name: i + 1 for i, name in enumerate(MONTHS)}  # "Jan" -> 1 ... "Dec" -> 12
INDEX_TO_MONTH: dict[int, str] = {i: name for name, i in MONTH_TO_INDEX.items()}

MonthName = Literal["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
TargetType = Literal["MONTHLY", "QUARTERLY", "BIANNUAL", "YEARLY"]
MeasurementUnit = Literal["COUNT", "PERCENT", "EURO", "DAYS", "TEXT"]


# --------------------------------------------------------------------- #
# Lookups - department/parameter dropdowns
# --------------------------------------------------------------------- #

class DepartmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str


class ParameterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    name: str
    department_id: uuid.UUID


# --------------------------------------------------------------------- #
# KPI Indicator - create / read
# --------------------------------------------------------------------- #

class CreateKpiRequest(BaseModel):
    """Backs 'Add' in KpiEntry.tsx. Department/Parameter are get-or-create
    by name (case-sensitive exact match) - matches the frontend's fixed
    dropdown lists today, but also works if those become free text later."""
    department: str = Field(min_length=1, max_length=150)
    parameter: str = Field(min_length=1, max_length=150)
    indicator_name: str = Field(min_length=1, max_length=255)
    annual_target: float = Field(gt=0)
    target_type: TargetType = "MONTHLY"
    measurement_unit: MeasurementUnit = "COUNT"
    person_in_charge: str | None = Field(default=None, max_length=255)


class MonthlyValueOut(BaseModel):
    month: MonthName
    actual_value: float | None
    target_value: float | None
    percentage: float | None


class KpiOut(BaseModel):
    id: uuid.UUID
    department: str
    parameter: str
    indicator_name: str
    annual_target: float
    target_type: TargetType
    measurement_unit: MeasurementUnit
    person_in_charge: str | None
    year: int
    monthly_values: list[MonthlyValueOut]
    created_at: datetime
    updated_at: datetime


class KpiListResponse(BaseModel):
    items: list[KpiOut]
    total: int
    page: int
    page_size: int


# --------------------------------------------------------------------- #
# Monthly value - create/update a single month
# --------------------------------------------------------------------- #

class UpdateKpiRequest(BaseModel):
    """Backs editing the indicator-level fields (Annual Target, Person
    Responsible, etc.) - separate from UpdateMonthRequest, which only ever
    touches one month's actual/target value. All fields optional; only
    whatever is provided gets changed."""
    indicator_name: str | None = Field(default=None, min_length=1, max_length=255)
    annual_target: float | None = Field(default=None, gt=0)
    target_type: TargetType | None = None
    measurement_unit: MeasurementUnit | None = None
    person_in_charge: str | None = None
    clear_person_in_charge: bool = False  # explicit unassign, since person_in_charge=None alone is ambiguous with "not provided"


class UpdateMonthRequest(BaseModel):
    """Backs a single grid-cell edit in KpiEntry.tsx / KpiUpdate.tsx.
    `target_value` is optional - if omitted on a month that has no row yet,
    the service defaults it to annual_target / 12 (see KpiService); if the
    month already has a row and target_value is omitted, the existing
    target_value is left unchanged."""
    actual_value: float | None = None
    target_value: float | None = None