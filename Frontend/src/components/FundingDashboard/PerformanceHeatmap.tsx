// PerformanceHeatmap.tsx
import { Fragment } from 'react';
import type { HeatmapRow } from '../../types/fundingDashboard';

interface PerformanceHeatmapProps {
  rows: HeatmapRow[];
}

const MONTH_LABELS = [
  'JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN',
  'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC',
];

export default function PerformanceHeatmap({ rows }: PerformanceHeatmapProps) {
  return (
    <div className="funding-heatmap-card">
      <div className="funding-chart-title">Monthly Performance Heatmap</div>
      <div className="funding-chart-subtitle">Performance across months</div>

      <div className="heatmap-scroll">
        <div className="heatmap-grid">
          {/* Header row */}
          <div className="heatmap-row-label heatmap-header-cell">Indicator</div>
          {MONTH_LABELS.map((month) => (
            <div className="heatmap-month-header" key={month}>
              {month}
            </div>
          ))}

          {/* Data rows — Fragment (not a <div>) so label + cells stay
              DIRECT children of .heatmap-grid, which CSS Grid requires
              in order to line them up in the 13-column layout. */}
          {rows.map((row) => (
            <Fragment key={row.indicator}>
              <div className="heatmap-row-label">{row.indicator}</div>
              {row.cells.map((cell, index) => (
                <div
                  key={index}
                  className={`heatmap-cell heatmap-${cell.status}`}
                  title={cell.valueLabel ?? 'On target'}
                >
                  {cell.valueLabel}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>

      <div className="heatmap-legend">
        <span className="heatmap-legend-item">
          <span className="heatmap-legend-swatch heatmap-on-target" />
          On Target (&gt;100%)
        </span>
        <span className="heatmap-legend-item">
          <span className="heatmap-legend-swatch heatmap-at-risk" />
          At Risk (80-99%)
        </span>
        <span className="heatmap-legend-item">
          <span className="heatmap-legend-swatch heatmap-below-target" />
          Below Target (&lt;80%)
        </span>
      </div>
    </div>
  );
}