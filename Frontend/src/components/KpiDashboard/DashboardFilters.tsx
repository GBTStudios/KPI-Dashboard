// CHANGED: this component used to own monthA/monthB/department as local
// state that was never read by anything else - Dashboard.tsx rendered
// <DashboardFilters options={filterOptions} /> and never got the
// selections back. That was fine for a static mock (nothing needed to
// react to it), but it means the filters have never actually filtered
// anything. Now it's a controlled component: Dashboard.tsx owns the
// state and passes it down + a single onChange callback, the same
// pattern used throughout the rest of this codebase (ExpenseForm,
// Settings, etc.). Also added the year dropdown, which didn't exist at
// all before - the Dashboard had no way to view any year but "whatever
// the backend defaulted to."

import type { FilterOptions } from '../../types/dashboard';

export interface DashboardFilterValues {
  year: number;
  monthA: string;
  monthB: string;
  department: string;
}

interface DashboardFiltersProps {
  options: FilterOptions;
  values: DashboardFilterValues;
  onChange: (values: DashboardFilterValues) => void;
}

export default function DashboardFilters({ options, values, onChange }: DashboardFiltersProps) {
  const years = options.years ?? [values.year];

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <span className="filter-label">Year</span>
        <select
          className="filter-select"
          value={values.year}
          onChange={(e) => onChange({ ...values, year: Number(e.target.value) })}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Comparing</span>
        <select
          className="filter-select"
          value={values.monthA}
          onChange={(e) => onChange({ ...values, monthA: e.target.value })}
        >
          {options.months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <span className="filter-label">vs</span>

      <div className="filter-group">
        <select
          className="filter-select"
          value={values.monthB}
          onChange={(e) => onChange({ ...values, monthB: e.target.value })}
        >
          {options.months.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-group">
        <span className="filter-label">Department</span>
        <select
          className="filter-select"
          value={values.department}
          onChange={(e) => onChange({ ...values, department: e.target.value })}
        >
          {options.departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
