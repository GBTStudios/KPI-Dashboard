// ============================================================
// TYPES FOR THE IMPORT DATA PAGE
// ============================================================

// --------------------------------------------------------------
// "How it works" step indicator
// --------------------------------------------------------------
export interface ImportStep {
  id: number;
  label: string;
}

// --------------------------------------------------------------
// The file the user has selected/dropped.
// ------------------------------------------------------------
// We store the ORIGINAL File object (`file`) in case we need it
// later (e.g. to actually upload it to a server), plus two
// pre-formatted display strings so components don't have to
// repeat formatting logic.
// --------------------------------------------------------------
export interface UploadedFileInfo {
  file: File;       // the real browser File object
  name: string;      // e.g. "filename.xlsx"
  sizeLabel: string; // e.g. "2.4 MB" — already formatted for display
}

// --------------------------------------------------------------
// Expected column pill
// --------------------------------------------------------------
export interface ExpectedColumn {
  label: string;
}

// --------------------------------------------------------------
// "Last Import" summary card
// ------------------------------------------------------------
// `status` is a union type (like KpiStatus in the Dashboard) —
// it can ONLY be one of these three exact strings.
// --------------------------------------------------------------
export type ImportStatus = 'Synced' | 'Failed' | 'Pending';

export interface LastImportInfo {
  name: string;
  syncedLabel: string; // e.g. "synced 2 days ago"
  status: ImportStatus;
}