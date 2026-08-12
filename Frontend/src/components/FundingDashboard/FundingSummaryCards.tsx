import { TrendingUp, Target, AlertCircle, CircleCheck, ArrowUp } from 'lucide-react';
import type { FundingSummaryCard } from '../../types/fundingDashboard';

interface FundingSummaryCardsProps {
  cards: FundingSummaryCard[];
}

const iconMap = { TrendingUp, Target, AlertCircle, CircleCheck };
type IconName = keyof typeof iconMap;

export default function FundingSummaryCards({ cards }: FundingSummaryCardsProps) {
  return (
    <div className="funding-summary-cards">
      {cards.map((card) => {
        const Icon = iconMap[card.icon as IconName];

        return (
          <div className={`funding-summary-card tone-${card.tone}`} key={card.title}>
            <div className="funding-summary-card-header">
              {Icon && <Icon size={16} className="funding-summary-card-icon" />}
              <span className="funding-summary-card-title">{card.title}</span>
            </div>

            <div className="funding-summary-card-value-row">
              <span className="funding-summary-card-value">{card.value}</span>
              {card.changeLabel && (
                <span
                  className={`funding-summary-card-change ${
                    card.changeDirection === 'down' ? 'down' : 'up'
                  }`}
                >
                  {card.changeDirection !== 'down' && <ArrowUp size={11} />}
                  {card.changeLabel}
                </span>
              )}
            </div>

            <div className="funding-summary-card-support">{card.supportingText}</div>
          </div>
        );
      })}
    </div>
  );
}