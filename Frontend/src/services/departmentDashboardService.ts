import { api } from "./api";
import type {
  FundingSummaryCard,
  MonthlyTrendPoint,
  ParameterPerformanceItem,
  KpiOverviewRow,
  HeatmapCell,
  HeatmapRow,
  AnnualTargetProgressData,
  ComparisonItem,
  AlertItem,
  FundingActivityItem,
} from "../types/fundingDashboard";

// --------------------------------------------------------------------- //
// Raw shapes returned by the backend - see app/schemas/department_dashboard.py
// --------------------------------------------------------------------- //

interface BackendDepartment {
  id: string;
  name: string;
}

interface BackendFundingSummaryCard {
  title: string;
  value: string;
  change_label: string | null;
  change_direction: "up" | "down" | null;
  supporting_text: string;
  icon: string;
  tone: "primary" | "success" | "danger" | "neutral";
}

interface BackendMonthlyTrendPoint {
  month: string;
  actual: number;
  target: number;
}

interface BackendParameterPerformanceItem {
  name: string;
  percentage: number;
  color: string;
}

interface BackendKpiOverviewRow {
  indicator: string;
  annual_target: number;
  current_ytd: number;
  achievement: number;
  status: "On Target" | "Near Target" | "Below Target";
  trend: "up" | "down";
}

interface BackendHeatmapCell {
  status: "on-target" | "at-risk" | "below-target";
  value_label: string | null;
}

interface BackendHeatmapRow {
  indicator: string;
  cells: BackendHeatmapCell[];
}

interface BackendAnnualTargetProgress {
  target_label: string;
  current_label: string;
  percentage: number;
  remaining_label: string;
  days_left_label: string;
}

interface BackendComparisonItem {
  label: string;
  change_label: string;
  direction: "up" | "down";
}

interface BackendAlertItem {
  id: string;
  title: string;
  description: string;
  tone: "danger" | "warning" | "success";
}

interface BackendRecentActivityItem {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

interface BackendDepartmentDashboard {
  department_id: string;
  department: string;
  year: number;
  month: string | null;
  parameter: string | null;
  page_title: string | null;
  page_subtitle: string | null;
  summary_cards: BackendFundingSummaryCard[];
  monthly_trend: BackendMonthlyTrendPoint[];
  parameter_performance: BackendParameterPerformanceItem[];
  kpi_overview_rows: BackendKpiOverviewRow[];
  heatmap_rows: BackendHeatmapRow[];
  annual_target_progress: BackendAnnualTargetProgress;
  monthly_comparison: BackendComparisonItem[];
  kpi_alerts: BackendAlertItem[];
  recent_activity: BackendRecentActivityItem[];
}

interface BackendDepartmentList {
  departments: BackendDepartment[];
}

interface BackendFilterOptions {
  departments: BackendDepartment[];
  years: number[];
  months: string[];
  parameters: string[];
}

// --------------------------------------------------------------------- //
// Frontend-facing shapes
// --------------------------------------------------------------------- //

export interface DepartmentOption {
  id: string;
  name: string;
}

export interface DepartmentDashboardData {
  pageTitle: string | undefined;
  pageSubtitle: string | undefined;
  summaryCards: FundingSummaryCard[];
  monthlyTrend: MonthlyTrendPoint[];
  parameterPerformance: ParameterPerformanceItem[];
  kpiOverviewRows: KpiOverviewRow[];
  heatmapRows: HeatmapRow[];
  annualTargetProgress: AnnualTargetProgressData;
  monthlyComparison: ComparisonItem[];
  kpiAlerts: AlertItem[];
  recentActivity: FundingActivityItem[];
}

export interface DepartmentFilterOptions {
  departments: DepartmentOption[];
  years: string[];
  months: string[];
  parameters: string[];
}

// --------------------------------------------------------------------- //
// Field-level mappers - each named and explicitly typed, so a shape
// mismatch errors right here (one clear line) instead of surfacing as a
// confusing error at the object-literal assembly site further down.
// --------------------------------------------------------------------- //

function toDepartmentOption(d: BackendDepartment): DepartmentOption {
  return { id: d.id, name: d.name };
}

function toSummaryCard(c: BackendFundingSummaryCard): FundingSummaryCard {
  const card: FundingSummaryCard = {
    title: c.title,
    value: c.value,
    supportingText: c.supporting_text,
    icon: c.icon,
    tone: c.tone,
  };
  if (c.change_label !== null) card.changeLabel = c.change_label;
  if (c.change_direction !== null) card.changeDirection = c.change_direction;
  return card;
}

function toMonthlyTrendPoint(p: BackendMonthlyTrendPoint): MonthlyTrendPoint {
  return { month: p.month, actual: p.actual, target: p.target };
}

function toParameterPerformanceItem(p: BackendParameterPerformanceItem): ParameterPerformanceItem {
  return { name: p.name, percentage: p.percentage, color: p.color };
}

function toKpiOverviewRow(r: BackendKpiOverviewRow): KpiOverviewRow {
  return {
    indicator: r.indicator,
    annualTarget: r.annual_target,
    currentYtd: r.current_ytd,
    achievement: r.achievement,
    status: r.status,
    trend: r.trend,
  };
}

function toHeatmapCell(c: BackendHeatmapCell): HeatmapCell {
  const cell: HeatmapCell = { status: c.status };
  if (c.value_label !== null) cell.valueLabel = c.value_label;
  return cell;
}

function toHeatmapRow(r: BackendHeatmapRow): HeatmapRow {
  const cells: HeatmapCell[] = [];
  for (const c of r.cells) {
    cells.push(toHeatmapCell(c));
  }
  return { indicator: r.indicator, cells };
}

function toAnnualTargetProgress(p: BackendAnnualTargetProgress): AnnualTargetProgressData {
  return {
    targetLabel: p.target_label,
    currentLabel: p.current_label,
    percentage: p.percentage,
    remainingLabel: p.remaining_label,
    daysLeftLabel: p.days_left_label,
  };
}

function toComparisonItem(c: BackendComparisonItem): ComparisonItem {
  return { label: c.label, changeLabel: c.change_label, direction: c.direction };
}

function toAlertItem(a: BackendAlertItem): AlertItem {
  return { id: a.id, title: a.title, description: a.description, tone: a.tone };
}

function toActivityItem(a: BackendRecentActivityItem): FundingActivityItem {
  return { id: a.id, actor: a.actor, action: a.action, timestamp: a.timestamp };
}

// --------------------------------------------------------------------- //
// Departments
// --------------------------------------------------------------------- //

export async function listDepartments(): Promise<DepartmentOption[]> {
  const res = await api.get<BackendDepartmentList>("/dashboard/departments");
  const departments: DepartmentOption[] = [];
  for (const d of res.departments) {
    departments.push(toDepartmentOption(d));
  }
  return departments;
}

// --------------------------------------------------------------------- //
// Dashboard
// --------------------------------------------------------------------- //

export interface GetDepartmentDashboardParams {
  departmentId: string;
  year: string; // e.g. "2026"
  month?: string; // 3-letter, e.g. "Jun" - MONTHS in DepartmentDashboard.tsx is full names, convert before calling
  parameter?: string; // omit or "All Parameters" for all
}

export async function getDepartmentDashboard(
  params: GetDepartmentDashboardParams
): Promise<DepartmentDashboardData> {
  const qs = new URLSearchParams();
  qs.set("year", params.year);
  if (params.month) qs.set("month", params.month);
  if (params.parameter && params.parameter !== "All Parameters") {
    qs.set("parameter", params.parameter);
  }

  const res = await api.get<BackendDepartmentDashboard>(
    `/dashboard/departments/${params.departmentId}/overview?${qs.toString()}`
  );

  const summaryCards: FundingSummaryCard[] = [];
  for (const c of res.summary_cards) {
    summaryCards.push(toSummaryCard(c));
  }

  const monthlyTrend: MonthlyTrendPoint[] = [];
  for (const p of res.monthly_trend) {
    monthlyTrend.push(toMonthlyTrendPoint(p));
  }

  const parameterPerformance: ParameterPerformanceItem[] = [];
  for (const p of res.parameter_performance) {
    parameterPerformance.push(toParameterPerformanceItem(p));
  }

  const kpiOverviewRows: KpiOverviewRow[] = [];
  for (const r of res.kpi_overview_rows) {
    kpiOverviewRows.push(toKpiOverviewRow(r));
  }

  const heatmapRows: HeatmapRow[] = [];
  for (const r of res.heatmap_rows) {
    heatmapRows.push(toHeatmapRow(r));
  }

  const monthlyComparison: ComparisonItem[] = [];
  for (const c of res.monthly_comparison) {
    monthlyComparison.push(toComparisonItem(c));
  }

  const kpiAlerts: AlertItem[] = [];
  for (const a of res.kpi_alerts) {
    kpiAlerts.push(toAlertItem(a));
  }

  const recentActivity: FundingActivityItem[] = [];
  for (const a of res.recent_activity) {
    recentActivity.push(toActivityItem(a));
  }

  const result: DepartmentDashboardData = {
    pageTitle: res.page_title !== null ? res.page_title : undefined,
    pageSubtitle: res.page_subtitle !== null ? res.page_subtitle : undefined,
    summaryCards,
    monthlyTrend,
    parameterPerformance,
    kpiOverviewRows,
    heatmapRows,
    annualTargetProgress: toAnnualTargetProgress(res.annual_target_progress),
    monthlyComparison,
    kpiAlerts,
    recentActivity,
  };

  return result;
}

export async function getDepartmentFilterOptions(
  departmentId: string,
  year: string
): Promise<DepartmentFilterOptions> {
  const res = await api.get<BackendFilterOptions>(
    `/dashboard/departments/${departmentId}/filter-options?year=${year}`
  );

  const departments: DepartmentOption[] = [];
  for (const d of res.departments) {
    departments.push(toDepartmentOption(d));
  }

  const years: string[] = [];
  for (const y of res.years) {
    years.push(String(y));
  }

  return {
    departments,
    years,
    months: res.months,
    parameters: res.parameters,
  };
}