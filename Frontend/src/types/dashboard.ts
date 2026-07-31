// In TypeScript, an "interface" describes the SHAPE of an
// object: what keys it has, and what type each key's value
// must be. It doesn't create any real data itself — it's just
// a contract that VS Code / the compiler checks for us.
//
// Think of it like a form template: the interface says
// "this object must have a title (text) and a value (text)",
// and every time we create an object of that type, TS makes
// sure we filled the form out correctly.


// 1. Summary Cards (the 4 cards at the top)
export interface SummaryCardData {
  title: string;
  value: string;          // e.g. "83%" or "5 / 7" — kept as string since format varies
  description?: string;   // "?" = optional. Not every card has a subtitle.
  icon: string;            // we'll store an icon *name* (string) and map it to a real icon component later
  trend?: 'up' | 'down';   // "?" optional, and the value can ONLY be 'up' or 'down' (a "union type")
}

// 2. Map Performance Chart (bar chart + target line)
export interface MapPerformancePoint {
  month: string;       // "JAN", "FEB", etc — x-axis label
  actual: number;       // height of the bar
  target: number;       // point on the dotted line
}


// 3. Department Performance (horizontal progress bars)
export interface DepartmentPerformanceData {
  department: string;
  percentage: number;   // 0–100, drives the bar width
  color: string;         // hex color for this specific bar
}

// 4. KPI Table rows
// This is a "union type" — status can ONLY be one of these
// three exact strings. If you typo 'On Targett', TS will
// immediately flag it as an error.
export type KpiStatus = 'On Target' | 'Near Target' | 'Below Target';

export interface KpiTableRow {
  indicator: string;
  department: string;
  may: number;
  june: number;
  change: number;         // signed number, e.g. +28 or -23
  status: KpiStatus;
}


// 5. Annual Target Progress (bottom-left bars)
export interface AnnualProgressData {
  label: string;
  percentage: number;
  color: string;
}


// 6. Recent Activity (bottom-right timeline)
export interface ActivityItem {
  id: string;
  actor: string;         // bold name, e.g. "Mary Precious"
  action: string;         // rest of the sentence, e.g. "submitted Programs KPIs"
  timestamp: string;      // e.g. "Today, 09:40 AM"
}


// 7. Filters (Compare Month 1 / Month 2 / Department)
export interface FilterOptions {
  months: string[];        // list of month names to choose from
  departments: string[];   // list of department names to choose from
}