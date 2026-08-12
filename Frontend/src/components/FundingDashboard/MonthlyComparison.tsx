
import { ArrowUp, ArrowDown } from 'lucide-react';
import type { ComparisonItem } from '../../types/fundingDashboard';

interface MonthlyComparisonProps {
  items: ComparisonItem[];
}

export default function MonthlyComparison({ items }: MonthlyComparisonProps) {
  return (
    <div className="funding-bottom-card">
      <div className="funding-chart-title">May vs June Comparison</div>
      <div className="funding-chart-subtitle">Growth indicators for peak period</div>

      <div className="comparison-list">
        {items.map((item) => (
          <div className="comparison-row" key={item.label}>
            <span className="comparison-label">{item.label}</span>
            <span className={`comparison-change ${item.direction}`}>
              {item.changeLabel}
              {item.direction === 'up' ? <ArrowUp size={13} /> : <ArrowDown size={13} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}