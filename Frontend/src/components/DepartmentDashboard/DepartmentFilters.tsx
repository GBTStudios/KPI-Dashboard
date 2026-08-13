// Refactored from the old FundingFilters.tsx. Structurally almost
// identical — same controlled-select pattern — the real change is
// `department`/`onDepartmentChange` are now typed as DepartmentKey
// instead of a free-form string, so this component can only ever
// be given one of the 7 real department names, never a typo.

import { Download } from 'lucide-react';
import type { DepartmentFilterOptions, DepartmentKey } from '../../types/departmentDashboard';

interface DepartmentFiltersProps {
  options: DepartmentFilterOptions;
  department: DepartmentKey;
  onDepartmentChange: (value: DepartmentKey) => void;
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
            // e.target.value is always `string` in the DOM, so it's
            // cast to DepartmentKey here. This is safe (not a lie to
            // the compiler) because every <option> below is rendered
            // FROM options.departments, which is already typed as
            // DepartmentKey[] — the value can never be anything else.
            onChange={(e) => onDepartmentChange(e.target.value as DepartmentKey)}
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