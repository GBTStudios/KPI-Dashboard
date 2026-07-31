import { useState } from 'react';
import type { FilterOptions } from '../../types/dashboard';

interface DashboardFiltersProps {
  options: FilterOptions;
}

export default function DashboardFilters({ options }: DashboardFiltersProps) {
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