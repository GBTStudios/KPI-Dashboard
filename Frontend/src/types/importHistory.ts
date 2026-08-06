// ============================================================
// TYPES FOR THE IMPORT HISTORY PAGE
// ============================================================

// --------------------------------------------------------------
// ImportStatus
// ------------------------------------------------------------
// Why "completed" | "failed" instead of `string`?
//
// If this were typed as `string`, ANY text would be valid —
// "Completed", "done", "faild" (typo) would all compile fine,
// and ImportStatusBadge would have no idea how to render an
// unrecognized value. By restricting it to exactly these two
// literal strings, TypeScript will refuse to compile anywhere
// a typo'd or unexpected status sneaks in — including later,
// when real API data gets mapped into this shape. The backend
// contract becomes enforced by the type system, not by hoping
// everyone remembers the exact spelling.
// --------------------------------------------------------------
export type ImportStatus = 'completed' | 'failed';

// --------------------------------------------------------------
// ImportRecord — one row of the table.
// ------------------------------------------------------------
// Every field maps directly to something visible in the design:
//   id            — stable unique identifier, used as the React
//                    `key` when rendering rows and for the future
//                    delete API call (never use array index for this)
//   fileName      — "Q1_Talent_Retention_Final.xlsx"
//   fileCode      — "IMP-2024-001", the internal reference code
//   fileSize      — pre-formatted string, e.g. "2.4 MB" (formatting
//                    bytes is a backend/display concern, not something
//                    this type needs to compute)
//   rows          — row count as a real `number`, so future features
//                    (sorting, summing) can do math on it directly
//   uploadDate    — pre-formatted display string for now (e.g.
//                    "2024-03-24 09:45 AM"); a real API would likely
//                    send an ISO date and we'd format it on the way in
//   uploaderName  — display name, e.g. "Jane Doe"
//   uploaderEmail — e.g. "jane.doe@insightflow.com"
//   status        — see ImportStatus above
// --------------------------------------------------------------
export interface ImportRecord {
  id: string;
  fileName: string;
  fileCode: string;
  fileSize: string;
  rows: number;
  uploadDate: string;
  uploaderName: string;
  uploaderEmail: string;
  status: ImportStatus;
}

// --------------------------------------------------------------
// Summary card data
// ------------------------------------------------------------
// Each value is `number | null` (or `string | null`) — NOT just
// `number`. `null` explicitly represents "we don't have this yet"
// (no API call made, or it returned nothing) as distinct from the
// real value `0`. This is the type-level version of an empty
// state: components can check `=== null` and render "—" instead
// of guessing whether 0 is real data or a placeholder.
// --------------------------------------------------------------
export interface ImportHistorySummaryData {
  last7DaysSuccessful: number | null;
  recentFailures: number | null;
  // Pre-formatted because abbreviating large numbers ("1.4M") is
  // a display/backend concern — this type just carries a label.
  totalRowsProcessedLabel: string | null;
}

// --------------------------------------------------------------
// Pagination state
// ------------------------------------------------------------
// currentPage lives in the PAGE's React state (see ImportHistory.tsx),
// but totalPages/totalRecords will eventually come from the API
// response alongside the records themselves.
// --------------------------------------------------------------
export interface ImportHistoryPaginationInfo {
  currentPage: number;
  totalPages: number;
  totalRecords: number;
  pageSize: number;
}