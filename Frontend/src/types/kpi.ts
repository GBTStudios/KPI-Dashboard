export interface KpiIndicator {
  id: string;
  department: string;
  parameter: string;
  indicator: string;
  personInCharge: string;
  annualTarget: number;
  year: number; // reporting year this row's monthly data belongs to - see kpiService.ts
  monthlyTarget: number[]; // 12 values, Jan–Dec
  monthlyActual: (number | null)[]; // 12 values, Jan–Dec
}

export const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function getEndOfYearActual(monthlyActual: (number | null)[]): number {
  return monthlyActual.reduce((sum: number, val) => sum + (val ?? 0), 0);
}

export function getEndOfYearTarget(monthlyTarget: number[]): number {
  return monthlyTarget.reduce((sum: number, val) => sum + (val ?? 0), 0);
}