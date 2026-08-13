import { TrendingUp, Target, Users } from 'lucide-react';
import type { ParameterSummary } from '../../types/departmentParameter';

interface ParameterSummaryCardsProps {
  summary: ParameterSummary;
}

export default function ParameterSummaryCards({ summary }: ParameterSummaryCardsProps) {
  return (
    <div className="param-summary-cards">
      <div className="param-summary-card">
        <div>
          <div className="param-summary-card-title">AVG. ACHIEVEMENT</div>
          <div className="param-summary-card-value">{summary.averageAchievement}%</div>
        </div>
        <span className="param-summary-card-icon">
          <TrendingUp size={18} />
        </span>
      </div>

      <div className="param-summary-card">
        <div>
          <div className="param-summary-card-title">TOTAL PARAMETERS</div>
          <div className="param-summary-card-value">{summary.totalParameters}</div>
        </div>
        <span className="param-summary-card-icon">
          <Target size={18} />
        </span>
      </div>

      <div className="param-summary-card">
        <div>
          <div className="param-summary-card-title">ACTIVE LEADS</div>
          <div className="param-summary-card-value">{summary.activeLeads}</div>
        </div>
        <span className="param-summary-card-icon">
          <Users size={18} />
        </span>
      </div>
    </div>
  );
}