import type { FundingActivityItem } from '../../types/fundingDashboard';

interface RecentActivityProps {
  items: FundingActivityItem[];
  onViewAll: () => void;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function RecentActivity({ items, onViewAll }: RecentActivityProps) {
  return (
    <div className="funding-bottom-card">
      <div className="funding-activity-header">
        <div>
          <div className="funding-chart-title">Recent Activity</div>
          <div className="funding-chart-subtitle">Latest department updates</div>
        </div>
        <button type="button" className="funding-view-all-link" onClick={onViewAll}>
          View All
        </button>
      </div>

      <div className="funding-activity-list">
        {items.map((item) => (
          <div className="funding-activity-item" key={item.id}>
            <span className="funding-activity-avatar">{getInitials(item.actor)}</span>
            <div>
              <div className="funding-activity-text">
                <span className="funding-activity-actor">{item.actor}</span> {item.action}
              </div>
              <div className="funding-activity-timestamp">{item.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}