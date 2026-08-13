// ============================================================
// TYPES — Parameter Performance detail page
// ------------------------------------------------------------
// Reuses DepartmentKey from departmentDashboard.ts rather than
// redefining the department list a third time.
// ============================================================

import type { DepartmentKey } from './departmentDashboard';

// --------------------------------------------------------------
// Summary cards (AVG. ACHIEVEMENT / TOTAL PARAMETERS / ACTIVE LEADS)
// --------------------------------------------------------------
export interface ParameterSummary {
  averageAchievement: number; // e.g. 86.4 (percent)
  totalParameters: number;
  activeLeads: number;
}

// --------------------------------------------------------------
// One row of the Parameter Performance Breakdown table
// --------------------------------------------------------------
export type ParameterRowStatus = 'on-target' | 'near-target' | 'below-target';

export interface ParameterBreakdownRow {
  id: string;
  code: string; // e.g. "PRM-1002" — shown under the parameter name
  parameter: string;
  responsibleName: string;
  responsibleRole: string;
  annualTarget: number; // EUR
  actualValue: number;
  // A handful of points (not tied to specific months) driving the
  // small sparkline — shape only, not meant to be a full 12-month series.
  monthlyProgression: number[];
  achievement: number; // percent, drives both the badge text and the progress bar
  status: ParameterRowStatus;
}

// --------------------------------------------------------------
// Achievement Distribution card
// --------------------------------------------------------------
export interface AchievementDistribution {
  weightLabel: string; // e.g. "Institutional Grants Weight"
  weightPercentage: number; // e.g. 42
  highestContributionLabel: string; // e.g. "Sponsorships"
  lowestAchievementLabel: string; // e.g. "Corporate"
}

// --------------------------------------------------------------
// Operational Insights card
// ------------------------------------------------------------
// `tone: 'success'` renders as a short green caption (matching the
// screenshot's "SUCCESS TREND" style) instead of a full sentence —
// both are just `description`, styling is what differs.
// --------------------------------------------------------------
export type InsightTone = 'warning' | 'success';

export interface OperationalInsight {
  id: string;
  title: string;
  description: string;
  tone: InsightTone;
}

// --------------------------------------------------------------
// Everything one department needs for this page
// --------------------------------------------------------------
export interface DepartmentParameterData {
  summary: ParameterSummary;
  rows: ParameterBreakdownRow[];
  achievementDistribution: AchievementDistribution;
  operationalInsights: OperationalInsight[];
}

// Same enforcement pattern as DepartmentDashboardData — TypeScript
// requires every DepartmentKey to have an entry.
export type DepartmentParameterDataset = Record<DepartmentKey, DepartmentParameterData>;