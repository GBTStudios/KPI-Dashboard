
// Filters
export interface FundingFilterOptions {
  departments: string[];
  years: string[];
  months: string[];
  parameters: string[];
}

// Summary cards
export type SummaryCardTone = 'primary' | 'success' | 'danger' | 'neutral';

export interface FundingSummaryCard {
  title: string;
  value: string;
  changeLabel?: string;       // e.g. "+6%"
  changeDirection?: 'up' | 'down';
  supportingText: string;      // e.g. "vs 81% last month"
  icon: string;                 // icon name, mapped to a component in FundingSummaryCards.tsx
  tone: SummaryCardTone;
}

// Monthly Performance Trend chart
export interface MonthlyTrendPoint {
  month: string;
  actual: number;
  target: number;
}

// Parameter Performance
export interface ParameterPerformanceItem {
  name: string;
  percentage: number;
  color: string;
}

// KPI Performance Overview table
export type KpiStatus = 'On Target' | 'Near Target' | 'Below Target';
export type KpiTrend = 'up' | 'down';

export interface KpiOverviewRow {
  indicator: string;
  annualTarget: number;
  currentYtd: number;
  achievement: number; // percentage
  status: KpiStatus;
  trend: KpiTrend;
}

// Monthly Performance Heatmap
export type HeatmapCellStatus = 'on-target' | 'at-risk' | 'below-target';

export interface HeatmapCell {
  status: HeatmapCellStatus;
  // Only shown for non-"on-target" cells in the design — an
  // on-target cell communicates fine with color alone since it's
  // the "default good" state; a flagged cell needs the number
  // so someone can see HOW far off it is at a glance.
  valueLabel?: string;
}

export interface HeatmapRow {
  indicator: string;
  cells: HeatmapCell[]; // exactly 12, Jan–Dec
}

// Annual Target Progress
export interface AnnualTargetProgressData {
  targetLabel: string;     // "700,000 EUR"
  currentLabel: string;    // "612,450 EUR"
  percentage: number;      // 87.5
  remainingLabel: string;  // "87,550 EUR"
  daysLeftLabel: string;   // "184 Days"
}

// May vs June Comparison
export interface ComparisonItem {
  label: string;
  changeLabel: string; // "+12.4%"
  direction: 'up' | 'down';
}

// KPI Alerts
export type AlertTone = 'danger' | 'warning';

export interface AlertItem {
  id: string;
  title: string;
  description: string;
  tone: AlertTone;
}

// Recent Activity
export interface FundingActivityItem {
  id: string;
  actor: string;
  action: string;
  timestamp: string;
}