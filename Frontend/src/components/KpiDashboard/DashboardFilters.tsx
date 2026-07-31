// Renders the "Comparing [May] vs [June]  Department [All]" bar.
//
// NEW CONCEPT: useState. This component needs to remember
// which options the user picked — that's "state". Every time
// state changes, React automatically re-renders this component
// with the new values. No backend wiring yet, per your spec —
// selections just live in memory for now.


import { useState } from 'react';
import type { FilterOptions } from '../../types/dashboard';

interface DashboardFiltersProps {
  options: FilterOptions;
}

export default function DashboardFilters({ options }: DashboardFiltersProps) {
  // useState<string>('May') means: "this piece of state is a string,
  // and it starts out as 'May'". `monthA` is the current value,
  // `setMonthA` is the function we call to change it.
  const [monthA, setMonthA] = useState<string>('May');
  const [monthB, setMonthB] = useState<string>('June');
  const [department, setDepartment] = useState<string>('All');

  return (
    <div className="filters-bar">
      <div className="filter-group">
        <span className="filter-label">Comparing</span>
        <select
          className="filter-select"
          value={monthA}
          // e.target.value is always a string in HTML, so no extra
          // conversion is needed here — it matches our string state.
          onChange={(e) => setMonthA(e.target.value)}
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
          value={monthB}
          onChange={(e) => setMonthB(e.target.value)}
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
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
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