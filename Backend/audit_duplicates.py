"""Read-only audit: find every likely duplicate Department/Parameter/
Indicator in the DB.

FIXED: the previous version only grouped names that were identical after
trimming whitespace and lowercasing - "Programs" and "PROGRAM" are
different STRINGS even after that (plural vs. singular), so they were
never grouped as duplicates at all, regardless of CANONICAL_NAMES in the
merge script (that dict only ever decided which name wins WITHIN an
already-found group - it never controlled grouping itself). That's why
you saw 0 duplicates despite having Programs/PROGRAM in the DB.

Real fix: ALIAS_GROUPS below is an explicit, manually-curated list of
known name variants that should be treated as the same department/
parameter - safe (no fuzzy auto-guessing that could wrongly merge two
genuinely different departments), but only catches what you've told it
about. Add "Programs"/"PROGRAM" and any others you know about here.

Also added: a separate, clearly-labeled ADVISORY section that flags
likely singular/plural variants NOT already covered by ALIAS_GROUPS, so
you can find others you don't already know about. This section is
informational only - it does not affect the duplicate counts above it,
and merge_duplicate_departments.py does not act on it.

Makes NO changes. Run from your Backend directory:
    python audit_duplicates.py
"""
import asyncio
from collections import defaultdict

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.session import AsyncSessionLocal
from app.models.department import Department
from app.models.kpi_indicator import KpiIndicator
from app.models.kpi_monthly_value import KpiMonthlyValue  # noqa: F401 - must be imported so KpiIndicator.monthly_values (a string-based relationship) can resolve
from app.models.parameter import Parameter

# ---------------------------------------------------------------------- #
# Known aliases - names that should be treated as the same department.
# Keep this list IDENTICAL to the one in merge_duplicate_departments.py -
# both scripts need to agree on what counts as a duplicate, or the audit
# will report groups the merge script doesn't know to merge (or vice
# versa). Add every known variant you're aware of; each inner list is one
# group (order doesn't matter here, unlike in the merge script).
# ---------------------------------------------------------------------- #
ALIAS_GROUPS: list[list[str]] = [
    ["Programs", "PROGRAM"],
]


def _norm(name: str) -> str:
    return " ".join(name.strip().split()).lower()


def _build_alias_lookup(groups: list[list[str]]) -> dict[str, str]:
    """Maps _norm(variant) -> a shared group key (the first variant's
    norm) for every name in every group, so any variant in a group
    normalizes to the same key."""
    lookup: dict[str, str] = {}
    for group in groups:
        key = _norm(group[0])
        for variant in group:
            lookup[_norm(variant)] = key
    return lookup


def _grouping_key(name: str, alias_lookup: dict[str, str]) -> str:
    n = _norm(name)
    return alias_lookup.get(n, n)


def _singularize(n: str) -> str:
    """Crude English singularization for the advisory heuristic only -
    good enough to flag "Programs"/"Program" as worth a look, not
    precise enough to trust for an actual auto-merge decision."""
    if n.endswith("ies") and len(n) > 3:
        return n[:-3] + "y"
    if n.endswith("s") and not n.endswith("ss"):
        return n[:-1]
    return n


async def main() -> None:
    alias_lookup = _build_alias_lookup(ALIAS_GROUPS)

    async with AsyncSessionLocal() as db:
        result = await db.execute(
            select(Department).options(
                selectinload(Department.parameters).selectinload(Parameter.indicators)
            )
        )
        departments = list(result.scalars().all())

        # ---- Departments (alias-aware) ---- #
        by_key_dept: dict[str, list[Department]] = defaultdict(list)
        for d in departments:
            by_key_dept[_grouping_key(d.name, alias_lookup)].append(d)

        dept_dupes = {k: v for k, v in by_key_dept.items() if len(v) > 1}
        print("=" * 70)
        print(f"DUPLICATE DEPARTMENTS: {len(dept_dupes)} group(s)")
        for key, group in dept_dupes.items():
            names = [d.name for d in group]
            total_indicators = sum(len(p.indicators) for d in group for p in d.parameters)
            print(f"  {names} - {total_indicators} indicator(s) total across both")

        # ---- Parameters (within the same grouped department) ---- #
        print()
        print("=" * 70)
        param_dupe_count = 0
        for key, group in by_key_dept.items():
            params_here: dict[str, list[Parameter]] = defaultdict(list)
            for d in group:
                for p in d.parameters:
                    params_here[_grouping_key(p.name, alias_lookup)].append(p)
            dupes = {k: v for k, v in params_here.items() if len(v) > 1}
            if dupes:
                print(f"DUPLICATE PARAMETERS under '{key}':")
                for pk, pgroup in dupes.items():
                    param_dupe_count += 1
                    names = [p.name for p in pgroup]
                    total_indicators = sum(len(p.indicators) for p in pgroup)
                    print(f"  {names} - {total_indicators} indicator(s) total")
        if param_dupe_count == 0:
            print("DUPLICATE PARAMETERS: none found")

        # ---- Indicators (within the same grouped department + parameter) ---- #
        print()
        print("=" * 70)
        indicator_dupe_count = 0
        indicator_dupe_total_rows = 0
        for key, group in by_key_dept.items():
            indicators_here: dict[tuple, list[KpiIndicator]] = defaultdict(list)
            for d in group:
                for p in d.parameters:
                    for i in p.indicators:
                        indicators_here[(_grouping_key(p.name, alias_lookup), _norm(i.indicator_name))].append(i)
            dupes = {k: v for k, v in indicators_here.items() if len(v) > 1}
            if dupes:
                print(f"DUPLICATE INDICATORS under '{key}':")
                for (pkey, inorm), igroup in dupes.items():
                    indicator_dupe_count += 1
                    indicator_dupe_total_rows += len(igroup)
                    print(f"  '{igroup[0].indicator_name}' under parameter '{pkey}' - {len(igroup)} row(s)")
        if indicator_dupe_count == 0:
            print("DUPLICATE INDICATORS: none found")

        print()
        print("=" * 70)
        total_indicator_rows = sum(len(p.indicators) for d in departments for p in d.parameters)
        excess_rows = indicator_dupe_total_rows - indicator_dupe_count
        print(f"Total KpiIndicator rows in DB: {total_indicator_rows}")
        print(f"Of which duplicates account for {indicator_dupe_total_rows} rows across {indicator_dupe_count} indicator(s)")
        print(f"Estimated real/deduplicated indicator count: {total_indicator_rows - excess_rows}")

        # ---- ADVISORY ONLY: possible variants not in ALIAS_GROUPS ---- #
        print()
        print("=" * 70)
        print("ADVISORY (not counted above, not acted on by the merge script):")
        print("Department name pairs that LOOK like singular/plural variants")
        print("of each other but aren't in ALIAS_GROUPS yet - review these and")
        print("add any real duplicates to ALIAS_GROUPS in both scripts:")
        seen_pairs = set()
        found_any = False
        dept_names = [d.name for d in departments]
        for name in dept_names:
            singular_key = _singularize(_norm(name))
            for other in dept_names:
                if other == name:
                    continue
                if _grouping_key(name, alias_lookup) == _grouping_key(other, alias_lookup):
                    continue  # already a known/confirmed duplicate, not advisory
                if _singularize(_norm(other)) == singular_key:
                    pair = tuple(sorted([name, other]))
                    if pair not in seen_pairs:
                        seen_pairs.add(pair)
                        print(f"  '{pair[0]}' <-> '{pair[1]}'")
                        found_any = True
        if not found_any:
            print("  none found")


if __name__ == "__main__":
    asyncio.run(main())