// ============================================================
// ImportHistorySummary.tsx
// ------------------------------------------------------------
// Renders the three top cards. NO mock numbers live here — the
// page passes in `data: ImportHistorySummaryData`, and every
// value is `number | null` / `string | null`. When a value is
// null, we render "—" instead of guessing or faking a number.
// Once a real API call exists, the page just passes real data
// in and this component needs ZERO changes.
// ============================================================

import { CircleCheck, CircleAlert, FileText } from 'lucide-react';
import type { ImportHistorySummaryData } from '../../types/importHistory';

interface ImportHistorySummaryProps {
  data: ImportHistorySummaryData;
}

export default function ImportHistorySummary({ data }: ImportHistorySummaryProps) {
  return (
    <div className="import-history-summary">
      <div className="summary-stat-card">
        <div className="summary-stat-header">
          <CircleCheck size={15} className="summary-stat-icon" />
          <span>Last 7 Days Successful</span>
        </div>
        <div className="summary-stat-value">
          {data.last7DaysSuccessful === null ? (
            '—'
          ) : (
            <>
              {data.last7DaysSuccessful} <span className="summary-stat-unit">Imports</span>
            </>
          )}
        </div>
      </div>

      <div className="summary-stat-card">
        <div className="summary-stat-header">
          <CircleAlert size={15} className="summary-stat-icon" />
          <span>Recent Failures</span>
        </div>
        <div className="summary-stat-value">
          {data.recentFailures === null ? (
            '—'
          ) : (
            <>
              {data.recentFailures} <span className="summary-stat-unit">Records</span>
            </>
          )}
        </div>
      </div>

      <div className="summary-stat-card">
        <div className="summary-stat-header">
          <FileText size={15} className="summary-stat-icon" />
          <span>Total Data Processed</span>
        </div>
        <div className="summary-stat-value">
          {data.totalRowsProcessedLabel === null ? (
            '—'
          ) : (
            <>
              {data.totalRowsProcessedLabel} <span className="summary-stat-unit">Rows</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}