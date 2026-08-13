// ============================================================
// KpiAlerts.tsx
// ------------------------------------------------------------
// The "N items need attention" count comes from `alerts.length`,
// not a hardcoded number — so the badge can never say "3" while
// only 2 alerts are actually rendered.
// ============================================================

import { AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import type { AlertItem } from '../../types/fundingDashboard';

interface KpiAlertsProps {
  alerts: AlertItem[];
}

function AlertIcon({ tone }: { tone: AlertItem['tone'] }) {
  if (tone === 'success') return <CheckCircle2 size={15} className="funding-alert-icon" />;
  if (tone === 'warning') return <Clock size={15} className="funding-alert-icon" />;
  return <AlertTriangle size={15} className="funding-alert-icon" />;
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
            <AlertIcon tone={alert.tone} />
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