import { api } from "./api";
import { MONTHS } from "../types/kpi";
import type { KpiIndicator } from "../types/kpi";

/**
 * ---------------------------------------------------------------------
 * Read this before wiring anything else in.
 * ---------------------------------------------------------------------
 *
 * 1. YEAR IS A REAL BACKEND DIMENSION.
 *    KpiMonthlyValue is (indicator_id, year, month) with a uniqueness
 *    constraint on that triple. Every read/write route on /kpis takes an
 *    optional `year` query param (defaults to the current calendar year
 *    server-side if omitted - see current_year() in kpi_service.py).
 *    Every function below that talks to the backend now takes/forwards
 *    a `year: number`. Always pass the year the UI's "Reporting year"
 *    dropdown is currently set to - don't rely on the server default,
 *    or switching years in the dropdown will silently keep showing/
 *    saving to whatever year the server picks.
 *
 * 2. NO AUTO-FILLED TARGETS. A month's target is null until the user
 *    (or an imported spreadsheet) actually provides one - never
 *    computed as annual_target / 12. That used to happen here AND on
 *    the backend, and it silently fabricated nonsense targets for any
 *    non-MONTHLY indicator (a biannual 5,000 lump sum showing up as a
 *    ~417 "target" on every month that was never meant to have one).
 *    toKpiIndicator() below passes target_value straight through as
 *    null/number - it does not invent a default for display either.
 *
 * 3. NO DRAFT/SUBMITTED STATE ON THE BACKEND.
 *    KpiOut has no status field. "Save draft" and "Submit"/"Finalize
 *    submission" are two buttons that do the exact same thing against
 *    this API: persist whatever's currently edited. I wired both to the
 *    same save function. If draft-vs-submitted is meant to be a real
 *    workflow state, that's also a backend addition (a status column +
 *    a schema field), not something inferable from what exists today.
 * ---------------------------------------------------------------------
 */

interface BackendMonthlyValue {
  month: (typeof MONTHS)[number];
  actual_value: number | null;
  target_value: number | null;
  percentage: number | null;
}

export interface BackendKpiOut {
  id: string;
  department: string;
  parameter: string;
  indicator_name: string;
  annual_target: number;
  target_type: "MONTHLY" | "QUARTERLY" | "BIANNUAL" | "YEARLY";
  measurement_unit: "COUNT" | "PERCENT" | "EURO" | "DAYS" | "TEXT";
  person_in_charge: string | null;
  year: number;
  monthly_values: BackendMonthlyValue[];
  created_at: string;
  updated_at: string;
}

interface BackendKpiListResponse {
  items: BackendKpiOut[];
  total: number;
  page: number;
  page_size: number;
}

/**
 * Backend -> frontend shape. A freshly-created indicator has an EMPTY
 * monthly_values array (rows are only created lazily, the first time a
 * month is actually edited) — so for any month with no row yet, target
 * and actual both stay null. Nothing is persisted until the user
 * actually edits and saves, and nothing is guessed for display either -
 * see the top-of-file note on why a computed default used to live here
 * and why that was wrong.
 */
export function toKpiIndicator(kpi: BackendKpiOut): KpiIndicator {
  const byMonth = new Map(kpi.monthly_values.map((mv) => [mv.month, mv]));

  const monthlyTarget: (number | null)[] = [];
  const monthlyActual: (number | null)[] = [];

  for (const month of MONTHS) {
    const existing = byMonth.get(month);
    monthlyTarget.push(existing?.target_value ?? null);
    monthlyActual.push(existing?.actual_value ?? null);
  }

  return {
    id: kpi.id,
    department: kpi.department,
    parameter: kpi.parameter,
    indicator: kpi.indicator_name,
    personInCharge: kpi.person_in_charge ?? "",
    annualTarget: kpi.annual_target,
    year: kpi.year,
    monthlyTarget,
    monthlyActual,
  };
}

export interface ListKpisParams {
  department?: string;
  parameter?: string;
  indicator?: string; // free-text search, matches indicator_name
  year?: number; // defaults server-side to the current year if omitted
  page?: number;
  pageSize?: number;
}

export async function listKpis(params: ListKpisParams = {}): Promise<{ items: KpiIndicator[]; total: number }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("page_size", String(params.pageSize ?? 100)); // no pagination UI yet - see note below
  if (params.department) qs.set("department", params.department);
  if (params.parameter) qs.set("parameter", params.parameter);
  if (params.indicator) qs.set("indicator", params.indicator);
  if (params.year) qs.set("year", String(params.year));

  const res = await api.get<BackendKpiListResponse>(`/kpis?${qs.toString()}`);
  return { items: res.items.map(toKpiIndicator), total: res.total };
  // NOTE: page_size=100 covers you until there are >100 KPI indicators
  // total. Neither KpiEntry.tsx nor KpiUpdate.tsx has pagination controls
  // today (they render everything returned in one table) - add controls
  // + pass `page` through once that becomes a real limit.
}

export interface CreateKpiPayload {
  department: string;
  parameter: string;
  indicatorName: string;
  annualTarget: number;
  personInCharge?: string;
  year?: number; // year the indicator's first monthly values belong to; defaults server-side to the current year
}

export async function createKpi(payload: CreateKpiPayload): Promise<KpiIndicator> {
  const qs = payload.year ? `?year=${payload.year}` : "";
  const kpi = await api.post<BackendKpiOut>(`/kpis${qs}`, {
    department: payload.department,
    parameter: payload.parameter,
    indicator_name: payload.indicatorName,
    annual_target: payload.annualTarget,
    target_type: "MONTHLY",
    measurement_unit: "COUNT",
    person_in_charge: payload.personInCharge || null,
  });
  return toKpiIndicator(kpi);
}

export async function updateAnnualTarget(id: string, annualTarget: number, year?: number): Promise<KpiIndicator> {
  const qs = year ? `?year=${year}` : "";
  const kpi = await api.patch<BackendKpiOut>(`/kpis/${id}${qs}`, { annual_target: annualTarget });
  return toKpiIndicator(kpi);
}

export async function updateMonth(
  id: string,
  month: (typeof MONTHS)[number],
  values: { actualValue: number | null; targetValue: number | null },
  year?: number
): Promise<BackendKpiOut> {
  const qs = year ? `?year=${year}` : "";
  return api.patch<BackendKpiOut>(`/kpis/${id}/months/${month}${qs}`, {
    actual_value: values.actualValue,
    target_value: values.targetValue,
  });
}

export async function deleteKpi(id: string): Promise<void> {
  await api.delete(`/kpis/${id}`);
}

/**
 * Persists one row's full local state: annual target (only if provided -
 * KpiUpdate's table has no annual-target input, so it never sends this)
 * plus all 12 months. Sends every month, not just changed ones - simpler
 * and correct (the backend just overwrites with the same value for
 * untouched months), at the cost of 12 requests per saved row instead of
 * a diffed subset. Fine at this data size; revisit if indicator counts
 * grow large enough that this feels slow.
 */
export async function saveIndicatorRow(
  indicator: KpiIndicator,
  options: { includeAnnualTarget: boolean }
): Promise<KpiIndicator> {
  // indicator.year is whatever reporting year was selected when this row
  // was loaded (see toKpiIndicator) - every write below must use that
  // same year, or a save made while viewing 2025 could end up writing to
  // whatever year the server defaults to instead.
  const year = indicator.year;

  if (options.includeAnnualTarget) {
    await updateAnnualTarget(indicator.id, indicator.annualTarget, year);
  }

  await Promise.all(
    MONTHS.map((month, i) =>
      updateMonth(
        indicator.id,
        month,
        {
          actualValue: indicator.monthlyActual[i],
          targetValue: indicator.monthlyTarget[i],
        },
        year
      )
    )
  );

  // Re-fetch so displayed percentages reflect the server's computation
  // (percentage is never trusted from the client - see kpi_service.py).
  const fresh = await api.get<BackendKpiOut>(`/kpis/${indicator.id}?year=${year}`);
  return toKpiIndicator(fresh);
}