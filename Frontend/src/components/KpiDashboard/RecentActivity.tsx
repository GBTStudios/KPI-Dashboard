// Renders the "Recent activity" timeline: a vertical connecting
// line with a circle marker per item. The connecting line is
// pure CSS (see .activity-item::before in Dashboard.css) —
// no extra library needed for that effect.


import type { ActivityItem } from '../../types/dashboard';

interface RecentActivityProps {
  items: ActivityItem[];
}

export default function RecentActivity({ items }: RecentActivityProps) {
  return (
    <div className="bottom-card">
      <div className="bottom-card-title">Recent activity</div>

      <div className="activity-list">
        {items.map((item) => (
          <div className="activity-item" key={item.id}>
            <div className="activity-icon" />
            <div>
              <div className="activity-text">
                <span className="activity-actor">{item.actor}</span> {item.action}
              </div>
              <div className="activity-timestamp">{item.timestamp}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}