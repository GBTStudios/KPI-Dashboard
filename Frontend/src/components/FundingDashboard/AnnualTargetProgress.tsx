// ============================================================
// AnnualTargetProgress.tsx
// ============================================================

import type { AnnualTargetProgressData } from '../../types/fundingDashboard';

interface AnnualTargetProgressProps {
  data: AnnualTargetProgressData;
}

export default function AnnualTargetProgress({ data }: AnnualTargetProgressProps) {
  return (
    <div className="funding-bottom-card">
      <div className="funding-chart-title">Annual Target Progress</div>
      <div className="funding-chart-subtitle">Progress towards {data.targetLabel} target</div>

      <div className="annual-progress-amount-row">
        <span className="annual-progress-amount">{data.currentLabel}</span>
        <span className="annual-progress-percentage">{data.percentage}%</span>
      </div>

      <div className="annual-progress-track">
        <div className="annual-progress-fill" style={{ width: `${data.percentage}%` }} />
      </div>

      <div className="annual-progress-footer">
        <div>
          <div className="annual-progress-footer-label">Remaining</div>
          <div className="annual-progress-footer-value">{data.remainingLabel}</div>
        </div>
        <div>
          <div className="annual-progress-footer-label">Days Left</div>
          <div className="annual-progress-footer-value">{data.daysLeftLabel}</div>
        </div>
      </div>
    </div>
  );
}