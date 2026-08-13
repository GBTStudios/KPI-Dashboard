// ============================================================
// TYPES FOR THE IMPORT HISTORY PAGE
// ============================================================

// --------------------------------------------------------------
// ImportStatus
// ------------------------------------------------------------
// Three states, not two - the backend's ImportHistory.status can be
// SUCCESS | PARTIAL_SUCCESS | FAILED (some rows can succeed while
// others fail validation in the same upload). 'partial' was added
// here to represent that faithfully rather than folding it into
// either 'completed' or 'failed', which would misrepresent a
// partially-successful import as either fully fine or fully broken.
// --------------------------------------------------------------
export type ImportStatus = 'completed' | 'partial' | 'failed';

// --------------------------------------------------------------
// ImportRecord — one row of the table.
// ------------------------------------------------------------
// Every field maps directly to something visible in the design:
//   id            — stable unique identifier, used as the React
//                    `key` when rendering rows and for the future
//                    delete API call (never use array index for this)
//   fileName      — "Q1_Talent_Retention_Final.xlsx"
//   fileCode      — "IMP-2024-001" - COSMETIC ONLY. The backend has
//                    no per-file reference code (not in the spec's
//                    ImportHistory fields), so this is synthesized
//                    client-side from the record's id/date - see
//                    services/importService.ts:synthesizeFileCode.
//                    Deterministic across reloads, but not a real
//                    sequence number.
//   fileSize      — pre-formatted string, e.g. "2.4 MB"
//   rows          — row count as a real `number`, so future features
//                    (sorting, summing) can do math on it directly
//   uploadDate    — pre-formatted display string (e.g.
//                    "2026-08-08 09:45 AM")
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