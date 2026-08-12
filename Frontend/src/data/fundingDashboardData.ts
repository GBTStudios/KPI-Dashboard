// ============================================================
// DUMMY DATA — Funding Department Dashboard
// ------------------------------------------------------------
// Every export here is typed against src/types/fundingDashboard.ts.
// When a real backend exists, each of these gets replaced by an
// API response of the same shape — no component code needs to
// change.
// ============================================================

import type {
  FundingFilterOptions,
  FundingSummaryCard,
  MonthlyTrendPoint,
  ParameterPerformanceItem,
  KpiOverviewRow,
  HeatmapRow,
  AnnualTargetProgressData,
  ComparisonItem,
  AlertItem,
  FundingActivityItem,
} from '../types/fundingDashboard';

// --------------------------------------------------------------
// Filters
// --------------------------------------------------------------
export const fundingFilterOptions: FundingFilterOptions = {
  departments: ['Funding'],
  years: ['2024', '2025', '2026'],
  months: [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ],
  parameters: ['All Parameters', 'Sponsorships', 'Grants', 'Private Donors', 'Corporate Partners'],
};

// --------------------------------------------------------------
// Summary cards
// --------------------------------------------------------------
export const fundingSummaryCards: FundingSummaryCard[] = [
  {
    title: 'OVERALL ACHIEVEMENT',
    value: '87%',
    changeLabel: '+6%',
    changeDirection: 'up',
    supportingText: 'vs 81% last month',
    icon: 'TrendingUp',
    tone: 'primary',
  },
  {
    title: 'KPIS ON TARGET',
    value: '9 / 12',
    supportingText: '75% of total KPIs',
    icon: 'Target',
    tone: 'success',
  },
  {
    title: 'KPIS BELOW TARGET',
    value: '3',
    supportingText: '25% of total KPIs',
    icon: 'AlertCircle',
    tone: 'danger',
  },
  {
    title: 'DATA COMPLETION',
    value: '98%',
    supportingText: 'Updated for June, 2026',
    icon: 'CircleCheck',
    tone: 'neutral',
  },
];

// --------------------------------------------------------------
// Monthly Performance Trend
// ------------------------------------------------------------
// Values expressed as percentages (0–100), matching the chart's
// "(%)" subtitle. Trend shape only — not real figures.
// --------------------------------------------------------------
export const monthlyTrendData: MonthlyTrendPoint[] = [
  { month: 'Jan', actual: 46, target: 50 },
  { month: 'Feb', actual: 48, target: 52 },
  { month: 'Mar', actual: 58, target: 60 },
  { month: 'Apr', actual: 64, target: 66 },
  { month: 'May', actual: 70, target: 74 },
  { month: 'Jun', actual: 76, target: 78 },
  { month: 'Jul', actual: 79, target: 80 },
  { month: 'Aug', actual: 83, target: 84 },
  { month: 'Sep', actual: 82, target: 88 },
  { month: 'Oct', actual: 86, target: 89 },
  { month: 'Nov', actual: 88, target: 91 },
  { month: 'Dec', actual: 91, target: 93 },
];

// --------------------------------------------------------------
// Parameter Performance
// ------------------------------------------------------------
// Gold added as a 4th accent color, alongside the existing theme
// (teal/blue/purple), to distinguish the Grants bar — the design
// calls for 4 visually distinct channels.
// --------------------------------------------------------------
export const parameterPerformance: ParameterPerformanceItem[] = [
  { name: 'Sponsorships', percentage: 94, color: '#1c9c6e' },
  { name: 'Grants', percentage: 81, color: '#e0a83e' },
  { name: 'Private Donors', percentage: 92, color: '#5575f2' },
  { name: 'Corporate Partners', percentage: 78, color: '#7c5cf0' },
];

// --------------------------------------------------------------
// KPI Performance Overview table
// --------------------------------------------------------------
export const kpiOverviewRows: KpiOverviewRow[] = [
  {
    indicator: 'New Individual Donors',
    annualTarget: 53690,
    currentYtd: 31800,
    achievement: 126,
    status: 'On Target',
    trend: 'up',
  },
  {
    indicator: 'Existing Individual Donors',
    annualTarget: 220880,
    currentYtd: 105500,
    achievement: 105,
    status: 'On Target',
    trend: 'up',
  },
  {
    indicator: 'Program Grants Submitted',
    annualTarget: 48,
    currentYtd: 44,
    achievement: 91,
    status: 'Near Target',
    trend: 'up',
  },
  {
    indicator: 'Corporate Partner Conversations',
    annualTarget: 36,
    currentYtd: 10,
    achievement: 36,
    status: 'Below Target',
    trend: 'down',
  },
  {
    indicator: 'Grant Success Rate (%)',
    annualTarget: 65,
    currentYtd: 60,
    achievement: 92,
    status: 'On Target',
    trend: 'up',
  },
  {
    indicator: 'Quality of Fit (Program)',
    annualTarget: 40,
    currentYtd: 34,
    achievement: 85,
    status: 'Near Target',
    trend: 'up',
  },
];

// --------------------------------------------------------------
// Monthly Performance Heatmap
// ------------------------------------------------------------
// 12 cells per row (Jan–Dec). Most cells are "on-target" and
// intentionally carry no valueLabel — see the type comment in
// fundingDashboard.ts for why.
// --------------------------------------------------------------
const onTarget = (): { status: 'on-target' } => ({ status: 'on-target' });
const atRisk = (label: string): { status: 'at-risk'; valueLabel: string } => ({
  status: 'at-risk',
  valueLabel: label,
});
const belowTarget = (label: string): { status: 'below-target'; valueLabel: string } => ({
  status: 'below-target',
  valueLabel: label,
});

export const heatmapRows: HeatmapRow[] = [
  {
    indicator: 'New Individual Donors',
    cells: [
      onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(),
      onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(),
    ],
  },
  {
    indicator: 'Existing Individual Donors',
    cells: [
      onTarget(), onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), onTarget(),
      onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(),
    ],
  },
  {
    indicator: 'Program Grants Submitted',
    cells: [
      onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), atRisk('88%'), onTarget(),
      atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(),
    ],
  },
  {
    indicator: 'Corporate Partner Conversations',
    cells: [
      onTarget(), onTarget(), onTarget(), belowTarget('72%'), atRisk('88%'), onTarget(),
      atRisk('88%'), belowTarget('40%'), belowTarget('69%'), belowTarget('30%'), belowTarget('20%'), onTarget(),
    ],
  },
  {
    indicator: 'Grant Success Rate (%)',
    cells: [
      onTarget(), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(),
      onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(),
    ],
  },
  {
    indicator: 'Quality of Fit (Program)',
    cells: [
      onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(),
      onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(),
    ],
  },
];

// --------------------------------------------------------------
// Annual Target Progress
// --------------------------------------------------------------
export const annualTargetProgress: AnnualTargetProgressData = {
  targetLabel: '700,000 EUR',
  currentLabel: '612,450 EUR',
  percentage: 87.5,
  remainingLabel: '87,550 EUR',
  daysLeftLabel: '184 Days',
};

// --------------------------------------------------------------
// May vs June Comparison
// --------------------------------------------------------------
export const monthlyComparison: ComparisonItem[] = [
  { label: 'Donations', changeLabel: '+12.4%', direction: 'up' },
  { label: 'Grant Success', changeLabel: '-2.1%', direction: 'down' },
  { label: 'Lead Volume', changeLabel: '+5.8%', direction: 'up' },
];

// --------------------------------------------------------------
// KPI Alerts
// ------------------------------------------------------------
// The card's "N items need attention" badge is computed from
// this array's length in KpiAlerts.tsx rather than hardcoded, so
// it can never drift out of sync with the actual list.
// --------------------------------------------------------------
export const kpiAlerts: AlertItem[] = [
  {
    id: 'alert-1',
    title: 'Grant Submission Rate',
    description: 'Currently 15% below threshold',
    tone: 'danger',
  },
  {
    id: 'alert-2',
    title: 'Review Pending',
    description: 'Sponsorship audit due in 2 days',
    tone: 'warning',
  },
  {
    id: 'alert-3',
    title: 'Corporate Partner Conversations',
    description: 'Tracking 64% below target for June',
    tone: 'danger',
  },
];

// --------------------------------------------------------------
// Recent Activity
// --------------------------------------------------------------
export const fundingRecentActivity: FundingActivityItem[] = [
  {
    id: 'activity-1',
    actor: 'Mary Precious',
    action: 'submitted Grant Success Rate KPI',
    timestamp: 'Today, 09:40 AM',
  },
  {
    id: 'activity-2',
    actor: 'John Doe',
    action: 'updated New Individual Donors data',
    timestamp: 'Yesterday, 04:12 PM',
  },
  {
    id: 'activity-3',
    actor: 'Maria Garcia',
    action: 'resolved Below Target alert',
    timestamp: 'Jun 5, 2026, 10:15 AM',
  },
];