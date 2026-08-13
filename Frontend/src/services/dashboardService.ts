import { api } from "./api";
import type {
  SummaryCardData,
  MapPerformancePoint,
  DepartmentPerformanceData,
  KpiTableRow,
  AnnualProgressData,
  ActivityItem,
  FilterOptions,
} from "../types/dashboard";

/**
 * Adapts the backend's DashboardOverviewOut into the exact shapes
 * SummaryCards/MapPerformanceChart/DepartmentPerformance/KpiTable/
 * AnnualProgress/RecentActivity already expect as props - so NONE of
 * those components need to change, only Dashboard.tsx's data source and
 * DashboardFilters.tsx's state ownership do.
 */

interface BackendSummary {
  overall_achievement_pct: number | null;
  kpis_on_track: number;
  kpis_below_target: number;
  kpis_total: number;
  departments_improving: number;
  departments_total: number;
}

interface BackendMapPoint {
  month: string;
  actual: number | null;
  target: number;
}

interface BackendDeptPerf {
  department: string;
  percentage: number;
  color: string;
}

interface BackendKpiRow {
  indicator: string;
  department: string;
  month_a_value: number | null;
  month_b_value: number | null;
  change: number | null;
  status: "On Target" | "Near Target" | "Below Target" | null;
}

interface BackendAnnualProgress {
  label: string;
  percentage: number | null;
  color: string;
}

interface BackendActivity {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}

interface BackendFilterOptions {
  years: number[];
  months: string[];
  departments: string[];
}

interface DashboardOverview {
  year: number;
  month_a: string;
  month_b: string;
  department_filter: string | null;
  summary: BackendSummary;
  map_performance: BackendMapPoint[];
  department_performance: BackendDeptPerf[];
  kpi_table: BackendKpiRow[];
  annual_progress: BackendAnnualProgress[];
  recent_activity: BackendActivity[];
  filter_options: BackendFilterOptions;
}

export interface DashboardViewModel {
  year: number;
  monthA: string;
  monthB: string;
  department: string; // "All" or an exact department name
  summaryCards: SummaryCardData[];
  mapPerformanceData: MapPerformancePoint[];
  departmentPerformance: DepartmentPerformanceData[];
  filterOptions: FilterOptions & { years: number[] };
  kpiTableData: KpiTableRow[];
  annualProgress: AnnualProgressData[];
  recentActivity: ActivityItem[];
}

export interface FetchDashboardParams {
  year?: number;
  monthA?: string;
  monthB?: string;
  department?: string; // omit or "All" for all departments
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// "N/M" summary-card value strings, matching the mock's existing format
// (e.g. "5 / 7") rather than inventing a new display convention.
function formatFraction(numerator: number, denominator: number): string {
  return `${numerator} / ${denominator}`;
}

export async function fetchDashboard(params: FetchDashboardParams = {}): Promise<DashboardViewModel> {
  const qs = new URLSearchParams();
  if (params.year) qs.set("year", String(params.year));
  if (params.monthA) qs.set("month_a", params.monthA);
  if (params.monthB) qs.set("month_b", params.monthB);
  if (params.department && params.department !== "All") qs.set("department", params.department);

  const data = await api.get<DashboardOverview>(`/dashboard/overview?${qs.toString()}`);

  const declined = data.summary.departments_total - data.summary.departments_improving;

  const summaryCards: SummaryCardData[] = [
    {
      title: "OVERALL ACHIEVEMENT",
      value: data.summary.overall_achievement_pct !== null ? `${data.summary.overall_achievement_pct}%` : "–",
      icon: "TrendingUp",
    },
    {
      title: "KPIS ON TRACK",
      value: formatFraction(data.summary.kpis_on_track, data.summary.kpis_total),
      icon: "BarChart3",
    },
    {
      title: "KPIS BELOW TARGET",
      value: String(data.summary.kpis_below_target),
      icon: "Activity",
    },
    {
      title: "DEPARTMENTS IMPROVING",
      value: formatFraction(data.summary.departments_improving, data.summary.departments_total),
      description: `${declined} department${declined === 1 ? "" : "s"} declined`,
      icon: "Users",
    },
  ];

  const mapPerformanceData: MapPerformancePoint[] = data.map_performance.map((p) => ({
    month: p.month.toUpperCase(),
    actual: p.actual ?? 0,
    target: p.target,
  }));

  const departmentPerformance: DepartmentPerformanceData[] = data.department_performance.map((d) => ({
    department: d.department,
    percentage: d.percentage,
    color: d.color,
  }));

  const kpiTableData: KpiTableRow[] = data.kpi_table
    .filter((row): row is BackendKpiRow & { status: NonNullable<BackendKpiRow["status"]> } => row.status !== null)
    .map((row) => ({
      indicator: row.indicator,
      department: row.department,
      may: row.month_a_value ?? 0, // field names are legacy ("may"/"june") - see types/dashboard.ts note
      june: row.month_b_value ?? 0,
      change: row.change ?? 0,
      status: row.status,
    }));

  const annualProgress: AnnualProgressData[] = data.annual_progress
    .filter((item): item is BackendAnnualProgress & { percentage: number } => item.percentage !== null)
    .map((item) => ({ label: item.label, percentage: item.percentage, color: item.color }));

  const recentActivity: ActivityItem[] = data.recent_activity.map((a) => ({
    id: a.id,
    actor: a.actor,
    action: a.action,
    timestamp: formatTimestamp(a.timestamp),
  }));

  return {
    year: data.year,
    monthA: data.month_a,
    monthB: data.month_b,
    department: data.department_filter ?? "All",
    summaryCards,
    mapPerformanceData,
    departmentPerformance,
    filterOptions: {
      years: data.filter_options.years,
      months: data.filter_options.months,
      departments: ["All", ...data.filter_options.departments],
    },
    kpiTableData,
    annualProgress,
    recentActivity,
  };
}
