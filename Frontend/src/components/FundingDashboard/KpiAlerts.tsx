// ============================================================
// KpiAlerts.tsx
// ------------------------------------------------------------
// The "N items need attention" count comes from `alerts.length`,
// not a hardcoded number — so the badge can never say "3" while
// only 2 alerts are actually rendered.
// ============================================================

import { AlertTriangle, Clock } from 'lucide-react';
import type { AlertItem } from '../../types/fundingDashboard';

interface KpiAlertsProps {
  alerts: AlertItem[];
}

export default function KpiAlerts({ alerts }: KpiAlertsProps) {
  return (
    <div className="funding-bottom-card">
      <div className="funding-alerts-header">
        <div>
          <div className="funding-chart-title">KPI Alerts</div>
          <div className="funding-chart-subtitle">{alerts.length} items need attention</div>
        </div>
        <span className="funding-alerts-count">{alerts.length}</span>
      </div>

      <div className="funding-alerts-list">
        {alerts.map((alert) => (
          <div className={`funding-alert-item tone-${alert.tone}`} key={alert.id}>
            {alert.tone === 'danger' ? (
              <AlertTriangle size={15} className="funding-alert-icon" />
            ) : (
              <Clock size={15} className="funding-alert-icon" />
            )}
            <div>
              <div className="funding-alert-title">{alert.title}</div>
              <div className="funding-alert-description">{alert.description}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}