// Renders the "Department performance" card: horizontal
// progress bars, one per department.
//
// We DON'T need Recharts here. A progress bar is really just
// an outer <div> (the grey track) with an inner <div> whose
// width is set to a percentage — plain CSS handles this fine.


import type { DepartmentPerformanceData } from '../../types/dashboard';

interface DepartmentPerformanceProps {
  data: DepartmentPerformanceData[];
}

export default function DepartmentPerformance({ data }: DepartmentPerformanceProps) {
  return (
    <div className="chart-card">
      <div className="chart-card-title">Department performance</div>
      <div className="chart-card-subtitle">Ranked by performance throughout the month</div>

      <div className="dept-perf-list">
        {data.map((dept) => (
          <div className="dept-perf-row" key={dept.department}>
            <span className="dept-perf-label">{dept.department}</span>

            <div className="dept-perf-track">
              {/* Inline style is the right tool here, NOT a CSS class —
                  the width is dynamic per-department, so it has to be
                  computed in JS/TS rather than fixed in the stylesheet. */}
              <div
                className="dept-perf-fill"
                style={{
                  width: `${dept.percentage}%`,
                  backgroundColor: dept.color,
                }}
              />
            </div>

            <span className="dept-perf-value">{dept.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}