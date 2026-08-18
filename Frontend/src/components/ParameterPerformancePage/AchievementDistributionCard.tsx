// ============================================================
// AchievementDistributionCard.tsx
// ============================================================

import type { AchievementDistribution } from '../../types/departmentParameter';

interface AchievementDistributionCardProps {
  data: AchievementDistribution;
}

export default function AchievementDistributionCard({ data }: AchievementDistributionCardProps) {
  return (
    <div className="funding-bottom-card">
      <div className="funding-chart-title">Achievement Distribution</div>
      <div className="funding-chart-subtitle">
        Comparison of parameter weights vs actual contribution
      </div>

      <div className="achievement-dist-row">
        <span className="achievement-dist-label">{data.weightLabel}</span>
        <span className="achievement-dist-percentage">{data.weightPercentage}% of total target</span>
      </div>
      <div className="achievement-dist-track">
        <div className="achievement-dist-fill" style={{ width: `${data.weightPercentage}%` }} />
      </div>

      <div className="achievement-dist-footer">
        <div>
          <div className="achievement-dist-footer-label">Highest Contrib.</div>
          <div className="achievement-dist-footer-value positive">{data.highestContributionLabel}</div>
        </div>
        <div>
          <div className="achievement-dist-footer-label">Lowest Achievement</div>
          <div className="achievement-dist-footer-value negative">{data.lowestAchievementLabel}</div>
        </div>
      </div>
    </div>
  );
}