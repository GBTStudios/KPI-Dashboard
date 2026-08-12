// KpiPerformanceTable.tsx
import { TrendingUp, TrendingDown } from 'lucide-react';
import type { KpiOverviewRow, KpiStatus } from '../../types/fundingDashboard';

interface KpiPerformanceTableProps {
  rows: KpiOverviewRow[];
  onViewAll: () => void;
}

const statusClassMap: Record<KpiStatus, string> = {
  'On Target': 'status-on-target',
  'Near Target': 'status-near-target',
  'Below Target': 'status-below-target',
};

export default function KpiPerformanceTable({ rows, onViewAll }: KpiPerformanceTableProps) {
  return (
    <div className="funding-table-card">
      <div className="funding-table-header">
        <div>
          <div className="funding-chart-title">KPI Performance Overview</div>
          <div className="funding-chart-subtitle">Performance summary for key indicators</div>
        </div>
        <button type="button" className="funding-view-all-btn" onClick={onViewAll}>
          View All KPIs
        </button>
      </div>

      <div className="funding-table-scroll">
        <table className="funding-kpi-table">
          <colgroup>
            <col style={{ width: '28%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '14%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Annual Target</th>
              <th>Current (YTD)</th>
              <th>Achievement</th>
              <th>Status</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.indicator}>
                <td className="funding-indicator-cell">{row.indicator}</td>
                <td>{row.annualTarget.toLocaleString()}</td>
                <td>{row.currentYtd.toLocaleString()}</td>
                <td className="funding-achievement-cell">{row.achievement}%</td>
                <td>
                  <span className={`status-badge ${statusClassMap[row.status]}`}>
                    {row.status}
                  </span>
                </td>
                <td>
                  {row.trend === 'up' ? (
                    <TrendingUp size={15} className="trend-up" />
                  ) : (
                    <TrendingDown size={15} className="trend-down" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}