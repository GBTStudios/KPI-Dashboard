// This page owns three pieces of state that its children don't:
//   - searchValue / statusValue  → the controlled filter inputs
//   - currentPage                → which pagination page is active
//
// These live HERE (not inside ImportHistoryFilters or
// ImportHistoryPagination) because this is the component that
// will eventually trigger a real API refetch whenever any of
// them change — the child components just display/control values,
// the page decides what to DO when they change.
//
// `records` is intentionally an empty array and `summaryData` is
// intentionally all nulls — see the NO MOCK DATA note below.


import { useState } from 'react';

import ImportHistorySummary from '../components/ImportHistory/ImportHistorySummary';
import ImportHistoryFilters from '../components/ImportHistory/ImportHistoryFilters';
import ImportHistoryTable from '../components/ImportHistory/ImportHistoryTable';
import ImportHistoryPagination from '../components/ImportHistory/ImportHistoryPagination';

import type { ImportRecord, ImportHistorySummaryData } from '../types/importHistory';

import '../styles/ImportHistory.css';


// NO MOCK DATA, per spec.
// `records` starts as an empty array — this is exactly what the
// UI will look like on day one, before any backend exists, and
// also exactly what it looks like if a real API call returns zero
// results. Both cases should render the SAME empty state, so
// testing with `[]` right now is actually testing real behavior,
// not a placeholder.
//
// `summaryData` uses `null` for every field for the same reason:
// null means "no value yet," which the summary cards render as "—".

const records: ImportRecord[] = [];

const summaryData: ImportHistorySummaryData = {
  last7DaysSuccessful: null,
  recentFailures: null,
  totalRowsProcessedLabel: null,
};

const PAGE_SIZE = 10;

export default function ImportHistory() {
  const [searchValue, setSearchValue] = useState('');
  const [statusValue, setStatusValue] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const totalRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / PAGE_SIZE));

  // "Showing 0-0 of 0 imports" while there's no real data, matching
  // the spec's requested placeholder — computed instead of hardcoded,
  // so it's already correct once real records exist.
  const rangeStart = totalRecords === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, totalRecords);
  const resultsLabel = `Showing ${rangeStart}-${rangeEnd} of ${totalRecords} imports`;

  function handleDelete(id: string) {
    // Placeholder only — no backend call yet, per spec.
    console.log('Delete requested for import:', id);
  }

  return (
    <div className="import-history-page">
      <h1 className="page-title">Import History</h1>

      <ImportHistorySummary data={summaryData} />

      <ImportHistoryFilters
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        statusValue={statusValue}
        onStatusChange={setStatusValue}
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