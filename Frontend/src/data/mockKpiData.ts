import type { KpiIndicator } from "../types/kpi";

export const mockKpiIndicators: KpiIndicator[] = [
  {
    id: "1",
    department: "Programs",
    parameter: "Campus",
    indicator: "Electricity uptime days/month",
    annualTarget: 360,
    monthlyTarget: Array(12).fill(30),
    monthlyActual: Array(12).fill(null),
  },
  {
    id: "2",
    department: "Programs",
    parameter: "Campus",
    indicator: "Internet uptime days/month",
    annualTarget: 360,
    monthlyTarget: Array(12).fill(30),
    monthlyActual: Array(12).fill(null),
  },
  {
    id: "3",
    department: "Programs",
    parameter: "Campus",
    indicator: "Beds occupied",
    annualTarget: 1200,
    monthlyTarget: Array(12).fill(100),
    monthlyActual: Array(12).fill(null),
  },
  {
    id: "4",
    department: "Marketing",
    parameter: "Digital",
    indicator: "Referral traffic",
    annualTarget: 960,
    monthlyTarget: Array(12).fill(80),
    monthlyActual: Array(12).fill(null),
  },
  {
    id: "5",
    department: "Funding",
    parameter: "Grants",
    indicator: "Grant applications submitted",
    annualTarget: 24,
    monthlyTarget: Array(12).fill(2),
    monthlyActual: Array(12).fill(null),
  },
];
