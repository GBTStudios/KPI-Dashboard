"""Validation and cleaning for uploaded KPI spreadsheets.

Kept separate from ImportService on purpose: this module is pure functions
over a DataFrame (no DB session, no I/O) so row-cleaning rules can be
tested in isolation from the transactional import logic.
"""
import math
import re
from dataclasses import dataclass, field
from typing import Literal

import pandas as pd

from app.schemas.imports import EXPECTED_COLUMNS, RowError

MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10MB

_MONTH_NAME_TO_INDEX: dict[str, int] = {
    name: i + 1
    for i, name in enumerate(
        ["January", "February", "March", "April", "May", "June",
         "July", "August", "September", "October", "November", "December"]
    )
}
# Accept common 3-letter abbreviations too - spreadsheets in the wild
# rarely stick to one convention.
_MONTH_ABBR_TO_INDEX: dict[str, int] = {
    name[:3]: idx for name, idx in _MONTH_NAME_TO_INDEX.items()
}

_VALID_TARGET_TYPES = {"MONTHLY", "QUARTERLY", "BIANNUAL", "YEARLY"}
_VALID_MEASUREMENT_UNITS = {"COUNT", "PERCENT", "EURO", "DAYS", "TEXT"}

# Normalized (lowercased, whitespace-collapsed) expected column name -> canonical name.
_NORMALIZED_EXPECTED = {" ".join(c.lower().split()): c for c in EXPECTED_COLUMNS}


@dataclass
class CleanedRow:
    row_number: int  # 1-indexed against spreadsheet data rows (header = row 1)
    department: str
    parameter: str
    indicator_name: str
    person_in_charge: str | None
    annual_target: float
    target_type: str
    measurement_unit: str
    year: int
    month: int  # 1-12
    actual_value: float | None
    target_value: float | None


@dataclass
class CleaningResult:
    rows: list[CleanedRow] = field(default_factory=list)
    errors: list[RowError] = field(default_factory=list)


def normalize_columns(df: pd.DataFrame) -> tuple[pd.DataFrame, list[str]]:
    """Trims/normalizes header names and maps them back to the canonical
    EXPECTED_COLUMNS spelling. Returns the renamed DataFrame and the list
    of expected columns that are still missing after normalization."""
    rename_map: dict[str, str] = {}
    for col in df.columns:
        key = " ".join(str(col).strip().lower().split())
        if key in _NORMALIZED_EXPECTED:
            rename_map[col] = _NORMALIZED_EXPECTED[key]
    df = df.rename(columns=rename_map)

    missing = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    return df, missing


ImportFormat = Literal["long", "wide", "unknown"]

# The long format's minimal fingerprint - if a sheet has all of these
# (after normalization), treat it as long format regardless of what else
# it does or doesn't contain.
_LONG_FORMAT_SIGNATURE = {"department", "parameter", "indicator", "year", "month", "actual value", "target value"}


def detect_format(df: pd.DataFrame) -> ImportFormat:
    """Two very different spreadsheet shapes are accepted:

    - "long": one row per (indicator, month), with explicit Year/Month/
      Actual Value/Target Value columns - the originally specced format.
    - "wide": one org's real KPI tracker layout - Department/Parameter/
      Indicator/Annual Target columns, a "Map" column labeling each row
      as Actuals/Target(...)/Percentage(%), and month names (January...
      December) as column headers instead of row values. No Year column
      at all - see ImportService.process_import for how that's supplied.

    Detected purely from the header row, so this must run before any
    column renaming happens.
    """
    normalized = {" ".join(str(c).strip().lower().split()) for c in df.columns}

    if _LONG_FORMAT_SIGNATURE.issubset(normalized):
        return "long"

    has_map = "map" in normalized
    has_indicator = "indicator" in normalized
    has_month_column = any(
        name.lower() in normalized for name in list(_MONTH_NAME_TO_INDEX) + list(_MONTH_ABBR_TO_INDEX)
    )
    if has_map and has_indicator and has_month_column:
        return "wide"

    return "unknown"


def _is_blank(value) -> bool:
    if value is None:
        return True
    if isinstance(value, float) and math.isnan(value):
        return True
    if isinstance(value, str) and not value.strip():
        return True
    return False


def _parse_month(value) -> int | None:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        month = int(value)
        return month if 1 <= month <= 12 else None
    text = str(value).strip()
    key_full = text.capitalize()
    if key_full in _MONTH_NAME_TO_INDEX:
        return _MONTH_NAME_TO_INDEX[key_full]
    key_abbr = text[:3].capitalize()
    return _MONTH_ABBR_TO_INDEX.get(key_abbr)


# Currency symbols and thousand-separator commas that real-world exports
# routinely bake into a cell's text (e.g. "31,800.00 €", "5,000 €") -
# stripped before parsing, not treated as a reason to reject the row.
# Whitespace is included since these often come with a non-breaking or
# ordinary space before/after the symbol.
_CURRENCY_CHARS_RE = re.compile(r"[€$£¥,\s]")


def _parse_number(value) -> float | None:
    if _is_blank(value):
        return None
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return float(value)

    text = str(value).strip()

    # Accounting-style negatives: "(1,234.00)" means -1234.00.
    negative = False
    if text.startswith("(") and text.endswith(")"):
        negative = True
        text = text[1:-1]

    text = _CURRENCY_CHARS_RE.sub("", text)
    if not text:
        return None

    try:
        result = float(text)
    except ValueError:
        return None

    return -result if negative else result


def clean_and_validate(df: pd.DataFrame) -> CleaningResult:
    """Row-by-row cleaning and validation, per the spec: trim whitespace,
    remove empty rows, convert numerics, convert year to int, convert
    month names to 1-12, reject invalid months/target types, reject
    duplicate rows within the file, reject rows missing mandatory fields.
    Never silently drops a bad row - every rejection becomes a RowError.
    """
    result = CleaningResult()
    seen_keys: dict[tuple, int] = {}  # (dept, param, indicator, year, month) -> first row_number seen

    for i, raw_row in enumerate(df.to_dict(orient="records")):
        row_number = i + 2  # header is spreadsheet row 1, data starts at row 2

        # Skip fully empty rows entirely (not an error - just a blank line in the sheet).
        if all(_is_blank(v) for v in raw_row.values()):
            continue

        def cell(col: str) -> str | None:
            v = raw_row.get(col)
            if _is_blank(v):
                return None
            return str(v).strip()

        department = cell("Department")
        parameter = cell("Parameter")
        indicator_name = cell("Indicator")
        person_in_charge = cell("Person Responsible")
        target_type_raw = cell("Target Type")
        measurement_unit_raw = cell("Measurement Unit")

        missing_fields = [
            label
            for label, v in [
                ("Department", department), ("Parameter", parameter),
                ("Indicator", indicator_name), ("Annual Target", cell("Annual Target")),
                ("Target Type", target_type_raw), ("Measurement Unit", measurement_unit_raw),
                ("Year", cell("Year")), ("Month", cell("Month")),
            ]
            if v is None
        ]
        if missing_fields:
            result.errors.append(RowError(
                row_number=row_number, column=missing_fields[0],
                message=f"Missing required value(s): {', '.join(missing_fields)}.",
            ))
            continue

        annual_target = _parse_number(raw_row.get("Annual Target"))
        if annual_target is None or annual_target <= 0:
            result.errors.append(RowError(
                row_number=row_number, column="Annual Target",
                message="Annual Target must be a positive number.",
            ))
            continue

        target_type = target_type_raw.upper()
        if target_type not in _VALID_TARGET_TYPES:
            result.errors.append(RowError(
                row_number=row_number, column="Target Type",
                message=f"Invalid Target Type '{target_type_raw}'. Must be one of: {', '.join(sorted(_VALID_TARGET_TYPES))}.",
            ))
            continue

        measurement_unit = measurement_unit_raw.upper()
        if measurement_unit not in _VALID_MEASUREMENT_UNITS:
            result.errors.append(RowError(
                row_number=row_number, column="Measurement Unit",
                message=f"Invalid Measurement Unit '{measurement_unit_raw}'. Must be one of: {', '.join(sorted(_VALID_MEASUREMENT_UNITS))}.",
            ))
            continue

        year_raw = raw_row.get("Year")
        try:
            year = int(float(year_raw))
        except (TypeError, ValueError):
            result.errors.append(RowError(
                row_number=row_number, column="Year", message=f"Invalid Year '{year_raw}'.",
            ))
            continue
        if not (2000 <= year <= 2100):
            result.errors.append(RowError(
                row_number=row_number, column="Year", message=f"Year {year} is out of range (2000-2100).",
            ))
            continue

        month = _parse_month(raw_row.get("Month"))
        if month is None:
            result.errors.append(RowError(
                row_number=row_number, column="Month", message=f"Invalid Month '{raw_row.get('Month')}'.",
            ))
            continue

        actual_value = _parse_number(raw_row.get("Actual Value"))
        target_value = _parse_number(raw_row.get("Target Value"))

        dup_key = (department.lower(), parameter.lower(), indicator_name.lower(), year, month)
        if dup_key in seen_keys:
            result.errors.append(RowError(
                row_number=row_number,
                message=f"Duplicate row for this Department/Parameter/Indicator/Year/Month "
                        f"(first seen at row {seen_keys[dup_key]}).",
            ))
            continue
        seen_keys[dup_key] = row_number

        result.rows.append(CleanedRow(
            row_number=row_number, department=department, parameter=parameter,
            indicator_name=indicator_name, person_in_charge=person_in_charge,
            annual_target=annual_target, target_type=target_type, measurement_unit=measurement_unit,
            year=year, month=month, actual_value=actual_value, target_value=target_value,
        ))

    return result


# ======================================================================
# Wide-format import - see detect_format's docstring for the layout.
#
# There's no machine-readable structure to lean on here (no explicit
# row-type marker beyond the free-text "Map" column, no column that
# says "this row belongs to that department"), so this is inherently
# more heuristic than the long-format parser. It's built directly
# against a real org's export rather than a spec, and handles:
#   - Department/Parameter using merged-cell carry-forward (blank on
#     every row except the first row of their group)
#   - Indicator names prefixed with "#"
#   - Exactly one Actuals row followed by exactly one Target(...) row
#     per indicator - the Percentage(%) row after that is always
#     skipped, same rule as everywhere else: percentage is never
#     trusted from the source, only ever computed here
#   - Currency-formatted Annual Target/month values (reuses _parse_number)
#   - Months with no data in either Actuals or Target are skipped, same
#     as the long format not getting a row for an untouched month
#
# KNOWN LIMITATION: an indicator whose Actuals/Target rows are
# completely empty across all 12 months produces zero CleanedRows, so
# it won't be created at all (nothing to anchor a get-or-create call
# to). Add those manually via KPI Entry instead.
# ======================================================================

_TARGET_TYPE_KEYWORDS: list[tuple[str, list[str]]] = [
    ("QUARTERLY", ["quarter"]),
    ("BIANNUAL", ["biannual", "bi-annual", "bi annual", "halfyear", "half year", "half-year", " hy"]),
    ("YEARLY", ["yearly"]),
]


def _infer_target_type(map_label: str) -> str:
    """From the Target row's own Map cell text, e.g. 'Target(Monthly)',
    'Target(biAnnual)', 'Target (Halfyear)', or bare 'Target'. Defaults
    to MONTHLY when nothing more specific is recognized - matches the
    most common label in the sample data."""
    text = map_label.lower()
    for target_type, keywords in _TARGET_TYPE_KEYWORDS:
        if any(keyword in text for keyword in keywords):
            return target_type
    return "MONTHLY"


def _find_column(normalized_to_original: dict[str, str], *candidates: str) -> str | None:
    for candidate in candidates:
        key = " ".join(candidate.lower().split())
        if key in normalized_to_original:
            return normalized_to_original[key]
    return None


def clean_and_validate_wide(df: pd.DataFrame, year: int) -> CleaningResult:
    """`year` applies to every row produced - the wide format has no
    Year column of its own, see ImportService.process_import."""
    result = CleaningResult()
    normalized_to_original = {" ".join(str(c).strip().lower().split()): c for c in df.columns}

    department_col = _find_column(normalized_to_original, "departments", "department")
    parameter_col = _find_column(normalized_to_original, "parameter", "parameters")
    person_col = _find_column(normalized_to_original, "person responsible")
    indicator_col = _find_column(normalized_to_original, "indicator")
    annual_target_col = _find_column(normalized_to_original, "annual target")
    map_col = _find_column(normalized_to_original, "map")

    if not (department_col and parameter_col and indicator_col and annual_target_col and map_col):
        result.errors.append(RowError(
            row_number=1,
            message="Could not locate Department/Parameter/Indicator/Annual Target/Map columns for the wide spreadsheet layout.",
        ))
        return result

    month_columns: dict[int, str] = {}
    for name, month_idx in _MONTH_NAME_TO_INDEX.items():
        col = _find_column(normalized_to_original, name, name[:3])
        if col:
            month_columns[month_idx] = col

    records = df.to_dict(orient="records")
    n = len(records)
    seen_keys: dict[tuple, int] = {}

    current_department: str | None = None
    current_parameter: str | None = None

    def map_value(record: dict) -> str:
        v = record.get(map_col)
        return "" if _is_blank(v) else str(v).strip().lower()

    i = 0
    while i < n:
        row = records[i]
        row_number = i + 2  # header is spreadsheet row 1

        if all(_is_blank(v) for v in row.values()):
            i += 1
            continue

        # Merged-cell carry-forward: only overwrite when this row actually
        # states a department/parameter; otherwise keep whatever the last
        # row that did establish.
        dept_cell = row.get(department_col)
        if not _is_blank(dept_cell):
            current_department = str(dept_cell).strip()
        param_cell = row.get(parameter_col)
        if not _is_blank(param_cell):
            current_parameter = str(param_cell).strip()

        indicator_cell = row.get(indicator_col)
        if _is_blank(indicator_cell):
            # A section-heading row (just declares department/parameter)
            # or a stray row - not the start of an indicator block.
            i += 1
            continue

        indicator_name = str(indicator_cell).strip().lstrip("#").strip()
        block_row_number = row_number

        if current_department is None or current_parameter is None:
            result.errors.append(RowError(
                row_number=block_row_number,
                message=f"'{indicator_name}' has no Department/Parameter above it in the sheet to inherit from.",
            ))
            i += 1
            continue

        annual_target = _parse_number(row.get(annual_target_col))
        if annual_target is None or annual_target <= 0:
            result.errors.append(RowError(
                row_number=block_row_number, column="Annual Target",
                message=f"Annual Target for '{indicator_name}' could not be parsed as a number: "
                        f"{row.get(annual_target_col)!r}. This indicator was not imported.",
            ))
            # Skip past this block's Target/Percentage rows so they aren't
            # mistaken for the start of a new block.
            i += 1
            while i < n and map_value(records[i]).startswith(("target", "percentage")):
                i += 1
            continue

        person_in_charge = None
        if person_col and not _is_blank(row.get(person_col)):
            person_in_charge = str(row.get(person_col)).strip()

        # Only real signal available for measurement unit in this layout -
        # a currency symbol in how Annual Target was written.
        measurement_unit = "EURO" if any(sym in str(row.get(annual_target_col)) for sym in "€$£¥") else "COUNT"

        actuals_row = row
        target_row: dict | None = None
        j = i + 1
        if j < n and map_value(records[j]).startswith("target"):
            target_row = records[j]
            j += 1

        if target_row is None:
            result.errors.append(RowError(
                row_number=block_row_number,
                message=f"'{indicator_name}' has an Actuals row but no Target row right after it - skipped.",
            ))
            i += 1
            continue

        target_type = _infer_target_type(str(target_row.get(map_col) or ""))

        if j < n and map_value(records[j]).startswith("percentage"):
            j += 1  # consume it - never imported, always recomputed

        for month_idx, col_name in month_columns.items():
            actual_value = _parse_number(actuals_row.get(col_name))
            target_value = _parse_number(target_row.get(col_name))
            if actual_value is None and target_value is None:
                continue

            dup_key = (current_department.lower(), current_parameter.lower(), indicator_name.lower(), year, month_idx)
            if dup_key in seen_keys:
                result.errors.append(RowError(
                    row_number=block_row_number,
                    message=f"Duplicate entry for {current_department}/{current_parameter}/{indicator_name} "
                            f"{year}-{month_idx:02d} (first seen at row {seen_keys[dup_key]}).",
                ))
                continue
            seen_keys[dup_key] = block_row_number

            result.rows.append(CleanedRow(
                row_number=block_row_number, department=current_department, parameter=current_parameter,
                indicator_name=indicator_name, person_in_charge=person_in_charge,
                annual_target=annual_target, target_type=target_type, measurement_unit=measurement_unit,
                year=year, month=month_idx, actual_value=actual_value, target_value=target_value,
            ))

        i = j

    return result