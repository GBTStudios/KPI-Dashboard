// ============================================================
// KpiIndicatorsSummary.tsx
// ------------------------------------------------------------
// "Data Integrity Status" is NOT new data — it's the department's
// existing "DATA COMPLETION" summary card (already computed and
// shown on the Department Dashboard), just re-displayed here with
// a progress bar. "Top Performing Owner" has no backing data
// anywhere in the project (no per-KPI ownership exists), so it's
// rendered as an explicit empty state instead of a guess.
// ============================================================

import { User } from 'lucide-react';
import type { FundingSummaryCard } from '../../types/fundingDashboard';

interface KpiIndicatorsSummaryProps {
  summaryCards: FundingSummaryCard[];
}

// Parses "98%" -> 98 for the progress bar width. Falls back to 0
// rather than throwing if the format ever changes upstream.
function parsePercentage(value: string): number {
  const match = value.match(/(\d+(\.\d+)?)/);
  return match ? Number(match[1]) : 0;
}

export default function KpiIndicatorsSummary({ summaryCards }: KpiIndicatorsSummaryProps) {
  const dataCompletionCard = summaryCards.find((card) => card.title === 'DATA COMPLETION');

  return (
    <div className="kpi-indicators-summary-row">
      <div className="kpi-indicators-summary-card">
        <div className="kpi-indicators-summary-label">
          <User size={13} />
          TOP PERFORMING OWNER
        </div>
        {/* Honest empty state — no ownership data exists per-KPI
            anywhere in the current architecture. */}
        <div className="kpi-owner-unavailable">
          Not available — KPI ownership isn't tracked yet.
        </div>
      </div>

      <div className="kpi-indicators-summary-card kpi-integrity-card">
        <div className="kpi-indicators-summary-label">DATA INTEGRITY STATUS</div>
        {dataCompletionCard ? (
          <>
            <div className="kpi-integrity-value">{dataCompletionCard.value}</div>
            <div className="kpi-integrity-bar-row">
              <div className="kpi-integrity-track">
                <div
                  className="kpi-integrity-fill"
                  style={{ width: `${parsePercentage(dataCompletionCard.value)}%` }}
                />
              </div>
              <button type="button" className="kpi-view-logs-btn">
                View Logs
              </button>
            </div>
            {dataCompletionCard.supportingText && (
              <div className="kpi-integrity-support">{dataCompletionCard.supportingText}</div>
            )}
          </>
        ) : (
          <div className="kpi-owner-unavailable">Data completion figures not available.</div>
        )}
      </div>
    </div>
  );
}