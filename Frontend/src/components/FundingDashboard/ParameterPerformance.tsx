// ParameterPerformance.tsx
import { ArrowUpRight, ExternalLink } from 'lucide-react';
import type { ParameterPerformanceItem } from '../../types/fundingDashboard';

interface ParameterPerformanceProps {
  items: ParameterPerformanceItem[];
  onViewDetails: () => void;
}

export default function ParameterPerformance({ items, onViewDetails }: ParameterPerformanceProps) {
  return (
    <div className="funding-chart-card">
      <div className="funding-chart-title">Parameter Performance</div>
      <div className="funding-chart-subtitle">Performance breakdown by funding channel</div>

      <div className="parameter-perf-list">
        {items.map((item) => (
          <div className="parameter-perf-row" key={item.name}>
            <div className="parameter-perf-label-row">
              <span className="parameter-perf-name">{item.name}</span>
              <span className="parameter-perf-value">
                {item.percentage}%
                <ArrowUpRight size={13} className="parameter-perf-trend-icon" />
              </span>
            </div>
            <div className="parameter-perf-track">
              <div
                className="parameter-perf-fill"
                style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
              />
            </div>
          </div>
        ))}
      </div>

      <button type="button" className="parameter-perf-link" onClick={onViewDetails}>
        View Detailed Breakdown
        <ExternalLink size={13} />
      </button>
    </div>
  );
}