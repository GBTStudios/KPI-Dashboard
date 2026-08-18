// ============================================================
// ParameterBreakdownTable.tsx
// ------------------------------------------------------------
// "Load More Parameters": rows are sliced client-side by
// `visibleCount`, which resets to INITIAL_VISIBLE whenever the
// department (and therefore `rows`) changes — otherwise switching
// from a department with 7 rows to one with 3 could leave stale
// state around. Structured so swapping this for real API pagination
// later just means changing what happens in handleLoadMore.
// ============================================================

import { useState, useEffect } from 'react';
import { Calendar, MoreVertical, ArrowRight } from 'lucide-react';
import type { ParameterBreakdownRow, ParameterRowStatus } from '../../types/departmentParameter';
import Sparkline from './Sparkline';

interface ParameterBreakdownTableProps {
  department: string;
  rows: ParameterBreakdownRow[];
  onViewDetails: (row: ParameterBreakdownRow) => void;
}

const INITIAL_VISIBLE = 5;
const LOAD_MORE_STEP = 5;

const STATUS_LABELS: Record<ParameterRowStatus, string> = {
  'on-target': 'ON TARGET',
  'near-target': 'NEAR TARGET',
  'below-target': 'BELOW TARGET',
};

const STATUS_CLASSES: Record<ParameterRowStatus, string> = {
  'on-target': 'status-on-target',
  'near-target': 'status-near-target',
  'below-target': 'status-below-target',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ParameterBreakdownTable({
  department,
  rows,
  onViewDetails,
}: ParameterBreakdownTableProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  // Reset pagination whenever the department changes — see note above.
  useEffect(() => {
    setVisibleCount(INITIAL_VISIBLE);
  }, [department]);

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <div className="param-breakdown-card">
      <div className="param-breakdown-header">
        <div>
          <div className="funding-chart-title">Parameter Performance Breakdown</div>
          <div className="funding-chart-subtitle">
            Detailed metrics and ownership for {department.toLowerCase()} parameters.
          </div>
        </div>
        <div className="param-breakdown-header-actions">
          <span className="param-breakdown-range">
            <Calendar size={13} />
            Last 6 Months
          </span>
          <button type="button" className="param-breakdown-menu-btn" aria-label="More options">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      <div className="param-table-scroll">
        <table className="param-breakdown-table">
          <colgroup>
            <col style={{ width: '18%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '8%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>Parameter</th>
              <th>Responsible Person</th>
              <th>Annual Target (EUR)</th>
              <th>Actual vs Target</th>
              <th>Monthly Progression</th>
              <th>Achievement %</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              // Clamped so a value far exceeding its target (e.g. 163%)
              // never breaks the bar's layout — the bar tops out
              // visually at 100% even though the number itself doesn't.
              const barPercentage = Math.min(100, Math.max(0, (row.actualValue / row.annualTarget) * 100));

              return (
                <tr key={row.id}>
                  <td>
                    <div className="param-name-cell">{row.parameter}</div>
                    <div className="param-code-cell">ID: {row.code}</div>
                  </td>
                  <td>
                    <div className="param-responsible-cell">
                      <span className="param-responsible-avatar">
                        {getInitials(row.responsibleName)}
                      </span>
                      <div>
                        <div className="param-responsible-name">{row.responsibleName}</div>
                        <div className="param-responsible-role">{row.responsibleRole}</div>
                      </div>
                    </div>
                  </td>
                  <td className="param-mono-cell">{row.annualTarget.toLocaleString()}</td>
                  <td>
                    <div className="param-mono-cell">{row.actualValue.toLocaleString()}</div>
                    <div className="param-actual-track">
                      <div
                        className={`param-actual-fill param-fill-${row.status}`}
                        style={{ width: `${barPercentage}%` }}
                      />
                    </div>
                  </td>
                  <td>
                    <Sparkline values={row.monthlyProgression} status={row.status} />
                  </td>
                  <td className="param-mono-cell">{row.achievement}%</td>
                  <td>
                    <span className={`status-badge ${STATUS_CLASSES[row.status]}`}>
                      {STATUS_LABELS[row.status]}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="param-row-action"
                      aria-label="View parameter details"
                      onClick={() => onViewDetails(row)}
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="param-load-more-row">
          <button
            type="button"
            className="param-load-more-btn"
            onClick={() => setVisibleCount((prev) => Math.min(rows.length, prev + LOAD_MORE_STEP))}
          >
            Load More Parameters
          </button>
        </div>
      )}
    </div>
  );
}