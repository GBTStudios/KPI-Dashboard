import { api } from "./api";
import type { ImportRecord, ImportHistorySummaryData, ImportStatus } from "../types/importHistory";
import type { ExpectedColumn, LastImportInfo } from "../types/importData";

/**
 * ---------------------------------------------------------------------
 * Read this before touching upload/template code.
 * ---------------------------------------------------------------------
 * api.ts's generic request() always sends Content-Type: application/json
 * and JSON.stringifies the body - that breaks multipart file uploads and
 * can't stream back a binary .xlsx file. uploadImport() and
 * downloadTemplate() below bypass api.ts and use fetch() directly instead,
 * the same approach Layout.tsx already uses for the avatar upload.
 * Every other function here goes through api.ts as normal.
 * ---------------------------------------------------------------------
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
const API_BASE = `${API_BASE_URL}/api/v1`;

// --------------------------------------------------------------------- //
// Raw shapes returned by the backend (/api/v1/imports*) - see app/schemas/imports.py
// --------------------------------------------------------------------- //

interface BackendRowError {
  row_number: number;
  column: string | null;
  message: string;
}

type BackendImportStatus = "SUCCESS" | "PARTIAL_SUCCESS" | "FAILED";

interface BackendImportHistoryOut {
  id: string;
  filename: string;
  uploaded_by: string | null;
  uploaded_by_email: string | null;
  uploaded_at: string; // ISO
  total_rows: number;
  imported_rows: number;
  failed_rows: number;
  status: BackendImportStatus;
  duration_ms: number;
  file_size_bytes: number;
  error_summary: string | null;
}

interface BackendImportResultOut {
  history: BackendImportHistoryOut;
  row_errors: BackendRowError[];
}

interface BackendImportHistoryListResponse {
  items: BackendImportHistoryOut[];
  total: number;
  page: number;
  page_size: number;
}

interface BackendImportSummaryOut {
  last_7_days_successful_imports: number;
  recent_failed_imports: number;
  total_rows_processed: number;
}

// --------------------------------------------------------------------- //
// Frontend-facing result of an upload
// --------------------------------------------------------------------- //

export interface ImportRowErrorInfo {
  rowNumber: number;
  column: string | null;
  message: string;
}

export interface ImportResult {
  record: ImportRecord;
  rowErrors: ImportRowErrorInfo[];
}

// --------------------------------------------------------------------- //
// Mapping helpers
// --------------------------------------------------------------------- //

const STATUS_TO_FRONTEND: Record<BackendImportStatus, ImportStatus> = {
  SUCCESS: "completed",
  PARTIAL_SUCCESS: "partial",
  FAILED: "failed",
};

const STATUS_TO_BACKEND: Record<string, BackendImportStatus> = {
  completed: "SUCCESS",
  partial: "PARTIAL_SUCCESS",
  failed: "FAILED",
};

function formatFileSize(bytes: number): string {
  const megabytes = bytes / (1024 * 1024);
  return `${megabytes.toFixed(1)} MB`;
}

function formatUploadDate(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString(undefined, { year: "numeric", month: "2-digit", day: "2-digit" });
  const timePart = date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  return `${datePart} ${timePart}`;
}

/** "2 mins ago" / "3 days ago" - same relative-time approach already
 * used in UserManagement.tsx's formatLastActivity, for consistency. */
function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/** COSMETIC ONLY - see the note in types/importHistory.ts on ImportRecord.fileCode. */
function synthesizeFileCode(id: string, uploadedAtIso: string): string {
  const year = new Date(uploadedAtIso).getFullYear();
  return `IMP-${year}-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

function toImportRecord(item: BackendImportHistoryOut): ImportRecord {
  return {
    id: item.id,
    fileName: item.filename,
    fileCode: synthesizeFileCode(item.id, item.uploaded_at),
    fileSize: formatFileSize(item.file_size_bytes),
    rows: item.total_rows,
    uploadDate: formatUploadDate(item.uploaded_at),
    uploaderName: item.uploaded_by ?? "Unknown",
    uploaderEmail: item.uploaded_by_email ?? "",
    status: STATUS_TO_FRONTEND[item.status],
  };
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem("authToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --------------------------------------------------------------------- //
// History list / delete / summary
// --------------------------------------------------------------------- //

export interface ListImportHistoryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: ImportStatus | "all";
}

export async function listImportHistory(
  params: ListImportHistoryParams = {}
): Promise<{ items: ImportRecord[]; total: number; page: number; pageSize: number }> {
  const qs = new URLSearchParams();
  qs.set("page", String(params.page ?? 1));
  qs.set("page_size", String(params.pageSize ?? 10));
  if (params.search) qs.set("search", params.search);
  if (params.status && params.status !== "all") {
    qs.set("status", STATUS_TO_BACKEND[params.status]);
  }

  const res = await api.get<BackendImportHistoryListResponse>(`/imports/history?${qs.toString()}`);
  return {
    items: res.items.map(toImportRecord),
    total: res.total,
    page: res.page,
    pageSize: res.page_size,
  };
}

export async function deleteImportHistory(id: string): Promise<void> {
  await api.delete(`/imports/history/${id}`);
}

export async function getImportSummary(): Promise<ImportHistorySummaryData> {
  const res = await api.get<BackendImportSummaryOut>("/imports/summary");
  return {
    last7DaysSuccessful: res.last_7_days_successful_imports,
    recentFailures: res.recent_failed_imports,
    totalRowsProcessedLabel: res.total_rows_processed.toLocaleString(),
  };
}

/** Backs LastImport.tsx on the Import Data page - the single most
 * recent history record, or null if nothing's ever been uploaded. */
export async function getLatestImport(): Promise<LastImportInfo | null> {
  const res = await api.get<BackendImportHistoryListResponse>("/imports/history?page=1&page_size=1");
  const latest = res.items[0];
  if (!latest) return null;

  const status: LastImportInfo["status"] =
    latest.status === "FAILED" ? "Failed" : latest.status === "PARTIAL_SUCCESS" ? "Pending" : "Synced";

  return {
    name: latest.filename,
    syncedLabel: `synced ${formatRelativeTime(latest.uploaded_at)}`,
    status,
  };
}

export async function getExpectedColumns(): Promise<ExpectedColumn[]> {
  const res = await api.get<{ required_columns: string[] }>("/imports/expected-columns");
  return res.required_columns.map((label) => ({ label }));
}

// --------------------------------------------------------------------- //
// Upload / template - raw fetch, see the top-of-file note
// --------------------------------------------------------------------- //

export async function uploadImport(file: File, year?: number): Promise<ImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  // Only consulted by the backend for wide-format sheets (no Year column
  // of their own) - long-format sheets carry Year per row and ignore this.
  if (year) formData.append("year", String(year));

  const response = await fetch(`${API_BASE}/imports`, {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });

  const json = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(json?.message || "Import failed. Please try again.");
  }

  const data = json.data as BackendImportResultOut;
  return {
    record: toImportRecord(data.history),
    rowErrors: data.row_errors.map((e) => ({ rowNumber: e.row_number, column: e.column, message: e.message })),
  };
}

export async function downloadTemplate(): Promise<void> {
  const response = await fetch(`${API_BASE}/imports/template`, { headers: authHeaders() });
  if (!response.ok) {
    throw new Error("Could not download the template. Please try again.");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "kpi_import_template.xlsx";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}