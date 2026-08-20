// ============================================================
// ImportHistory.tsx
// ------------------------------------------------------------
// CHANGED: records/summaryData are no longer hardcoded empty/null -
// they're fetched from the backend. The empty-state behavior the
// original comments described is preserved exactly: an empty result
// from the real API renders the same empty state as `[]` did before,
// since nothing about ImportHistoryTable/ImportHistorySummary changed.
//
// searchValue/statusValue/currentPage are still owned here (as before)
// and now actually drive a refetch. A request-counter guard (same
// pattern used in KpiUpdate.tsx after a real race-condition bug there)
// prevents a slow, stale response from one filter combination
// overwriting a newer one if requests resolve out of order.
// ============================================================

import { useEffect, useRef, useState } from 'react';

import ImportHistorySummary from '../components/ImportHistory/ImportHistorySummary';
import ImportHistoryFilters from '../components/ImportHistory/ImportHistoryFilters';
import ImportHistoryTable from '../components/ImportHistory/ImportHistoryTable';
import ImportHistoryPagination from '../components/ImportHistory/ImportHistoryPagination';

import type { ImportRecord, ImportHistorySummaryData, ImportStatus } from '../types/importHistory';
import { listImportHistory, deleteImportHistory, getImportSummary } from '../services/importService';

import '../styles/ImportHistory.css';

const PAGE_SIZE = 10;

export default function ImportHistory() {
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState<ImportStatus | 'all'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [records, setRecords] = useState<ImportRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [summaryData, setSummaryData] = useState<ImportHistorySummaryData>({
    last7DaysSuccessful: null,
    recentFailures: null,
    totalRowsProcessedLabel: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const requestId = useRef(0);

  async function loadRecords() {
    const id = ++requestId.current;
    setIsLoading(true);
    setError(null);
    try {
      const res = await listImportHistory({
        page: currentPage,
        pageSize: PAGE_SIZE,
        search: searchValue || undefined,
        status: statusValue,
      });
      if (id !== requestId.current) return; // a newer request has since started
      setRecords(res.items);
      setTotalRecords(res.total);
    } catch (err) {
      if (id !== requestId.current) return;
      setError(err instanceof Error ? err.message : 'Could not load import history.');
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusValue]);

  // Search is debounced separately and always resets to page 1 - same
  // pattern as UserManagement.tsx. If we're already on page 1, changing
  // the page number won't retrigger the effect above, so this branch
  // fetches directly in that case.
  useEffect(() => {
    const handle = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
      else loadRecords();
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  useEffect(() => {
    getImportSummary()
      .then(setSummaryData)
      .catch(() => {
        // Summary cards just stay at "—" on failure - non-critical.
      });
  }, []);

  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);
  const resultsLabel = isLoading
    ? 'Loading...'
    : `Showing ${rangeStart}-${rangeEnd} of ${totalRecords} imports`;

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteImportHistory(id);
      await loadRecords();
      getImportSummary().then(setSummaryData).catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete that import record.');
    }
  }

  return (
    <div className="import-history-page">
      <h1 className="page-title">Import History</h1>

      {error && (
        <p role="alert" style={{ color: '#b91c1c', margin: '8px 0' }}>
          {error}
        </p>
      )}

      <ImportHistorySummary data={summaryData} />

      <ImportHistoryFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusValue={statusValue}
        onStatusChange={(value) => {
          setStatusValue(value as ImportStatus | 'all');
          setCurrentPage(1);
        }}
        resultsLabel={resultsLabel}
      />

      <ImportHistoryTable records={records} onDelete={handleDelete} />

      <ImportHistoryPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}