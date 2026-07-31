
// Renders the 4 cards at the top of the dashboard
// (Overall Achievement, KPIs On Track, etc).
//
// NEW CONCEPT: this component takes "props" — data passed in
// from a parent component — instead of importing the mock data
// itself. This makes SummaryCards reusable: it doesn't care
// WHERE the data came from, only that it matches SummaryCardData[].

import { TrendingUp, BarChart3, Activity, Users } from 'lucide-react';
import type { SummaryCardData } from '../../types/dashboard';

// A "props type" describes what this component expects to receive.
// Here: one key, `cards`, which is an array of SummaryCardData.
interface SummaryCardsProps {
  cards: SummaryCardData[];
}

// We stored icon names as plain strings in the mock data (e.g. "TrendingUp")
// because you can't put a real component inside a data file cleanly.
// This lookup object maps that string to the actual icon component.
const iconMap = {
  TrendingUp,
  BarChart3,
  Activity,
  Users,
};

// TypeScript trick: this says "iconName must be one of the keys of iconMap"
// so if mock data ever has a typo'd icon name, TS will catch it.
type IconName = keyof typeof iconMap;

export default function SummaryCards({ cards }: SummaryCardsProps) {
  return (
    <div className="summary-cards">
      {cards.map((card) => {
        // Look up the real icon component for this card
        const Icon = iconMap[card.icon as IconName];

        return (
          <div className="summary-card" key={card.title}>
            <div className="summary-card-header">
              <span className="summary-card-title">{card.title}</span>
              {Icon && <Icon size={18} className="summary-card-icon" />}
            </div>
            <div className="summary-card-value">{card.value}</div>
            {card.description && (
              <div className="summary-card-description">{card.description}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}