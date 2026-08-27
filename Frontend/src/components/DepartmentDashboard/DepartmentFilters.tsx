// ============================================================
// DepartmentFilters.tsx
// ------------------------------------------------------------
// CHANGED: `department`/`onDepartmentChange` are now plain `string`
// instead of `DepartmentKey`. Departments used to be a fixed
// 7-value compile-time union; now they come from the backend's
// `departments` table (see services/departmentDashboardService.ts)
// and can be any string that table returns. The type-safety this
// component used to provide (only a real department name compiles)
// has moved to runtime instead — the caller is responsible for only
// passing values that actually came from a fetched departments list.
// ============================================================

import { Download } from 'lucide-react';
import type { DepartmentFilterOptions } from '../../types/departmentDashboard';

interface DepartmentFiltersProps {
  options: DepartmentFilterOptions;
  department: string;
  onDepartmentChange: (value: string) => void;
  year: string;
  onYearChange: (value: string) => void;
  month: string;
  onMonthChange: (value: string) => void;
  parameter: string;
  onParameterChange: (value: string) => void;
  onExport: () => void;
}

export default function DepartmentFilters({
  options,
  department,
  onDepartmentChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  parameter,
  onParameterChange,
  onExport,
}: DepartmentFiltersProps) {
  return (
    <div className="funding-filters">
      <div className="funding-filters-group">
        <div className="funding-filter-field">
          <label className="funding-filter-label">Department</label>
          <select
            className="funding-filter-select"
            value={department}
            onChange={(e) => onDepartmentChange(e.target.value)}
          >
            {options.departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>

        <div className="funding-filter-field">
          <label className="funding-filter-label">Year</label>
          <select
            className="funding-filter-select"
            value={year}
            onChange={(e) => onYearChange(e.target.value)}
          >
            {options.years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        <div className="funding-filter-field">
          <label className="funding-filter-label">Month</label>
          <select
            className="funding-filter-select"
            value={month}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            {options.months.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="funding-filter-field">
          <label className="funding-filter-label">Parameter</label>
          <select
            className="funding-filter-select"
            value={parameter}
            onChange={(e) => onParameterChange(e.target.value)}
          >
            {options.parameters.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button type="button" className="funding-export-btn" onClick={onExport}>
        <Download size={15} />
        Export Report
      </button>
    </div>
  );
}