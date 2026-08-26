// ============================================================
// KpiIndicatorsTable.tsx
// ------------------------------------------------------------
// Built fresh (not a copy of KpiPerformanceTable.tsx) because
// this page needs genuinely different columns — Person Responsible,
// Monthly Progress, and an actions menu don't exist in the compact
// dashboard table, and modifying that shared component to add them
// would change its appearance on the Department Dashboard too.
// Status-badge styling and trend icons follow the SAME visual
// convention as KpiPerformanceTable.tsx for consistency, just
// implemented locally since the column set differs.
//
// Two columns are intentionally rendered as empty states rather
// than fabricated: Person Responsible (no such field exists
// anywhere in KpiOverviewRow) and, for indicators whose name
// doesn't match a HeatmapRow, Monthly Progress.
// ============================================================

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, User, MoreVertical } from 'lucide-react';
import type { KpiOverviewRow, KpiStatus, HeatmapRow } from '../../types/fundingDashboard';
import ImportHistoryPagination from '../ImportHistory/ImportHistoryPagination';

interface KpiIndicatorsTableProps {
  department: string;
  rows: KpiOverviewRow[];
  heatmapRows: HeatmapRow[];
}

const STATUS_CLASSES: Record<KpiStatus, string> = {
  'On Target': 'status-on-target',
  'Near Target': 'status-near-target',
  'Below Target': 'status-below-target',
};

const PAGE_SIZE = 10;

// Case-insensitive match — several departments' kpiOverviewRows and
// heatmapRows indicator strings differ slightly in casing/wording
// (a real gap in the current data, not something to paper over
// with fuzzy/partial matching that could silently pair the wrong row).
function findHeatmapRow(indicator: string, heatmapRows: HeatmapRow[]): HeatmapRow | undefined {
  const target = indicator.trim().toLowerCase();
  return heatmapRows.find((row) => row.indicator.trim().toLowerCase() === target);
}

function MiniProgressStrip({ heatmapRow }: { heatmapRow: HeatmapRow | undefined }) {
  if (!heatmapRow) {
    return <span className="mini-strip-empty">No trend data</span>;
  }

  return (
    <div className="mini-strip">
      {heatmapRow.cells.map((cell, index) => (
        <span
          key={index}
          className={`mini-strip-cell mini-strip-${cell.status}`}
          title={cell.valueLabel ?? 'On target'}
        />
      ))}
    </div>
  );
}

export default function KpiIndicatorsTable({ department, rows, heatmapRows }: KpiIndicatorsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to page 1 whenever the department (and therefore `rows`)
  // changes, same reasoning as ParameterBreakdownTable's Load More reset.
  useEffect(() => {
    setCurrentPage(1);
  }, [department]);

  const totalRecords = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="kpi-indicators-card">
      <div className="funding-chart-title">Performance Indicators</div>

      <div className="kpi-indicators-table-scroll">
        <table className="kpi-indicators-table">
          <colgroup>
            <col style={{ width: '20%' }} />
            <col style={{ width: '16%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '10%' }} />
            <col style={{ width: '11%' }} />
            <col style={{ width: '6%' }} />
          </colgroup>
          <thead>
            <tr>
              <th>KPI Name</th>
              <th>Person Responsible</th>
              <th>Annual Target</th>
              <th>Current Value</th>
              <th>Monthly Progress</th>
              <th>Achievement %</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td colSpan={8} className="kpi-indicators-empty">
                  No KPIs available for {department}.
                </td>
              </tr>
            ) : (
              visibleRows.map((row) => {
                const matchedHeatmapRow = findHeatmapRow(row.indicator, heatmapRows);

                return (
                  <tr key={row.indicator}>
                    <td className="kpi-name-cell">{row.indicator}</td>
                    <td>
                      {/* No ownership data exists in KpiOverviewRow — honest
                          empty state rather than an invented name. */}
                      <div className="kpi-responsible-cell unassigned">
                        <span className="kpi-responsible-icon">
                          <User size={14} />
                        </span>
                        Not assigned
                      </div>
                    </td>
                    <td className="kpi-mono-cell">{row.annualTarget.toLocaleString()}</td>
                    <td className="kpi-mono-cell">{row.currentYtd.toLocaleString()}</td>
                    <td>
                      <MiniProgressStrip heatmapRow={matchedHeatmapRow} />
                    </td>
                    <td className="kpi-mono-cell kpi-achievement-cell">{row.achievement}%</td>
                    <td>
                      <span className={`status-badge ${STATUS_CLASSES[row.status]}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="kpi-actions-cell">
                      {row.trend === 'up' ? (
                        <TrendingUp size={15} className="trend-up" />
                      ) : (
                        <TrendingDown size={15} className="trend-down" />
                      )}
                      <button
                        type="button"
                        className="kpi-row-menu-btn"
                        aria-label={`More actions for ${row.indicator}`}
                        onClick={() => console.log('KPI row action requested', row.indicator)}
                      >
                        <MoreVertical size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalRecords > 0 && (
        <div className="kpi-indicators-footer">
          <span className="kpi-indicators-results-label">
            Showing {rangeStart}-{rangeEnd} of <strong>{totalRecords}</strong> results
          </span>
          <ImportHistoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
}