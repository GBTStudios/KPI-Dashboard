// Renders "Annual target progress" — a label + percentage above
// each bar, stacked vertically. Same width-as-percentage trick
// as DepartmentPerformance, just a different layout.


import type { AnnualProgressData } from '../../types/dashboard';

interface AnnualProgressProps {
  data: AnnualProgressData[];
}

export default function AnnualProgress({ data }: AnnualProgressProps) {
  return (
    <div className="bottom-card">
      <div className="bottom-card-title">Annual target progress</div>

      {data.map((item) => (
        <div className="annual-progress-row" key={item.label}>
          <div className="annual-progress-label-row">
            <span>{item.label}</span>
            <span>{item.percentage}%</span>
          </div>
          <div className="annual-progress-track">
            <div
              className="annual-progress-fill"
              style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}