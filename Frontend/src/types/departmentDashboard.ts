// ============================================================
// TYPES — Unified Department Dashboard
// ------------------------------------------------------------
// This file adds the NEW layer needed for a single, data-driven
// dashboard page. It deliberately reuses the field-level types
// already defined in fundingDashboard.ts (ParameterPerformanceItem,
// KpiOverviewRow, HeatmapRow, AnnualTargetProgressData,
// ComparisonItem, AlertItem, FundingSummaryCard, FundingActivityItem)
// rather than redefining them — those were already generic, not
// actually Funding-specific in shape, so redefining them here would
// be pure duplication.
// ============================================================

import type {
  FundingSummaryCard,
  MonthlyTrendPoint,
  ParameterPerformanceItem,
  KpiOverviewRow,
  HeatmapRow,
  AnnualTargetProgressData,
  ComparisonItem,
  AlertItem,
  FundingActivityItem,
} from './fundingDashboard';

// --------------------------------------------------------------
// DepartmentKey
// ------------------------------------------------------------
// A union type (not `string`) listing the exact 7 supported
// departments. This is what makes `departmentDashboardData[key]`
// type-safe — TypeScript will refuse to compile if any code tries
// to look up a department that isn't one of these exact 7 strings,
// catching typos at build time instead of failing silently in the
// browser with a blank dashboard.
// --------------------------------------------------------------
export type DepartmentKey =
  | 'Funding'
  | 'Marketing'
  | 'Monitoring and Evaluation'
  | 'Program'
  | 'Partnerships'
  | 'Mentorship'
  | 'Guest Speakers';

// Single source of truth for the list + iteration order used in
// the Department <select>. Typed as `readonly DepartmentKey[]` so
// nothing can accidentally push an invalid value into it later.
export const ALL_DEPARTMENTS: readonly DepartmentKey[] = [
  'Funding',
  'Marketing',
  'Monitoring and Evaluation',
  'Program',
  'Partnerships',
  'Mentorship',
  'Guest Speakers',
];

// --------------------------------------------------------------
// Filters
// ------------------------------------------------------------
// NOTE: no `parameters` field here — the Parameter dropdown's
// options depend on which department is selected (Funding's
// parameters are Sponsorships/Grants/..., Marketing's are
// Website/Social Media/...). That list is derived directly from
// the selected department's own parameterPerformance data inside
// DepartmentDashboard.tsx, so it can never drift out of sync with
// what parameters actually exist for that department.
// --------------------------------------------------------------
export interface DepartmentFilterOptions {
  departments: readonly DepartmentKey[];
  years: string[];
  months: string[];
  parameters: string[]; // computed per-render by the page, not stored per department
}

// --------------------------------------------------------------
// DepartmentData
// ------------------------------------------------------------
// Everything one department's dashboard needs to render. Note
// what's DELIBERATELY NOT here: page title, breadcrumb text, and
// filter subtitle. Those are all derivable from the DepartmentKey
// itself (e.g. `${key} Department Dashboard`), so storing them
// per-department would just be a second place they could drift
// out of sync with the actual selected department.
// --------------------------------------------------------------
export interface DepartmentData {
  // Optional overrides — most departments leave these unset and get
  // the generic `${department} Department Dashboard` / "Track and
  // analyze performance for all X department KPIs." text computed
  // in DepartmentDashboard.tsx. M&E's screenshot uses genuinely
  // different copy ("Monitoring & Evaluation Dashboard", a custom
  // survey-specific subtitle), so this escape hatch exists for
  // departments that don't follow the generic pattern.
  pageTitle?: string;
  pageSubtitle?: string;
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

// The full data structure: one DepartmentData per DepartmentKey.
// `Record<DepartmentKey, DepartmentData>` means TypeScript enforces
// that EVERY department in the union has an entry — if you add an
// 8th department to DepartmentKey above but forget to add its data,
// this type will fail to compile until you do.
export type DepartmentDashboardData = Record<DepartmentKey, DepartmentData>;