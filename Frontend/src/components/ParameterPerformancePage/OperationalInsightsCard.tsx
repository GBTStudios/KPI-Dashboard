import { Target, TrendingUp, ExternalLink } from 'lucide-react';
import type { OperationalInsight } from '../../types/departmentParameter';

interface OperationalInsightsCardProps {
  insights: OperationalInsight[];
}

export default function OperationalInsightsCard({ insights }: OperationalInsightsCardProps) {
  return (
    <div className="funding-bottom-card">
      <div className="funding-chart-title">Operational Insights</div>
      <div className="funding-chart-subtitle">System identified opportunities and risks.</div>

      <div className="op-insights-list">
        {insights.map((insight) => (
          <div className={`op-insight-item tone-${insight.tone}`} key={insight.id}>
            <span className="op-insight-icon">
              {insight.tone === 'success' ? <TrendingUp size={16} /> : <Target size={16} />}
            </span>
            <div className="op-insight-text">
              <div className="op-insight-title">{insight.title}</div>
              <div className={`op-insight-description ${insight.tone === 'success' ? 'success-caption' : ''}`}>
                {insight.description}
              </div>
            </div>
            <button type="button" className="op-insight-action" aria-label="Open insight details">
              <ExternalLink size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}