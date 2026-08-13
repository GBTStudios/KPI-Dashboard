// Renders the "KPIs requiring attention" table, including:
//  - colored change indicators (green up-arrow / red down-arrow)
//  - colored status badges (On Target / Near Target / Below Target)
//
// CHANGED: monthALabel/monthBLabel are new, optional props (default to
// "May"/"Jun" so nothing breaks if a caller doesn't pass them). The
// column headers used to be hardcoded text - harmless with static mock
// data, but wrong once the Dashboard's month filters are real: comparing
// March vs. September would still show "May"/"Jun" headers. Everything
// else in this component is untouched.

import { ArrowUp, ArrowDown } from 'lucide-react';
import type { KpiTableRow, KpiStatus } from '../../types/dashboard';

interface KpiTableProps {
  rows: KpiTableRow[];
  monthALabel?: string;
  monthBLabel?: string;
}

// Maps each possible status to its CSS class. Because KpiStatus is a
// union type ('On Target' | 'Near Target' | 'Below Target'), TypeScript
// guarantees this object covers every possible value — if a 4th status
// is ever added to the type, this object will error until you handle it too.
const statusClassMap: Record<KpiStatus, string> = {
  'On Target': 'status-on-target',
  'Near Target': 'status-near-target',
  'Below Target': 'status-below-target',
};

function countCriticalAlerts(rows: KpiTableRow[]): number {
  return rows.filter((row) => row.status === 'Below Target').length;
}
export default function KpiTable({ rows, monthALabel = 'May', monthBLabel = 'Jun' }: KpiTableProps) {
  const criticalCount = countCriticalAlerts(rows);

  return (
    <>
      <div className="kpi-table-header">
        <div>
          <div className="kpi-table-title">KPIs requiring attention</div>
          <div className="kpi-table-subtitle">
            Indicators ranked by the size of their swing between the two selected months
          </div>
        </div>
        {criticalCount > 0 && (
          <span className="critical-alert-pill">{criticalCount} Critical Alerts</span>
        )}
      </div>

      <div className="kpi-table-wrapper">
        <table className="kpi-table">
          <thead>
            <tr>
              <th>Indicator</th>
              <th>Department</th>
              <th>{monthALabel}</th>
              <th>{monthBLabel}</th>
              <th>Change</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isPositive = row.change >= 0;
              const absChange = Math.abs(row.change);
              return (
                <tr key={row.indicator}>
                  <td className="kpi-indicator-cell">{row.indicator}</td>
                  <td>{row.department}</td>
                  <td>{row.may}%</td>
                  <td>{row.june}%</td>
                  <td>
                    <span
                      className={`kpi-change-cell ${
                        isPositive ? 'kpi-change-up' : 'kpi-change-down'
                      }`}
                    >
                      {isPositive ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                      {absChange}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${statusClassMap[row.status]}`}>
                      {row.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
