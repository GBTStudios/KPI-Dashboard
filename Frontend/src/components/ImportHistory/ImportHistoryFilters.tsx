// ============================================================
// ImportHistoryFilters.tsx
// ------------------------------------------------------------
// This component does NOT own its own state. Instead, the
// current search text and status filter live in ImportHistory.tsx
// (the parent), and get passed down as props along with the
// functions to update them. This pattern is called "lifting
// state up" — useful here because the PARENT is what will
// eventually trigger an API refetch when these values change,
// so the parent needs to know their current values anyway.
// ============================================================

import { Search, Filter, ChevronDown } from 'lucide-react';

interface ImportHistoryFiltersProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  statusValue: string;
  onStatusChange: (value: string) => void;
  resultsLabel: string;
}

export default function ImportHistoryFilters({
  searchValue,
  onSearchChange,
  statusValue,
  onStatusChange,
  resultsLabel,
}: ImportHistoryFiltersProps) {
  return (
    <div className="import-history-filters">
      <div className="import-history-search">
        <Search size={15} className="import-history-search-icon" />
        <input
          type="text"
          placeholder="Search files or uploaders..."
          aria-label="Search files or uploaders"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className="import-history-search-input"
        />
      </div>

      <div className="import-history-status-filter">
        <Filter size={15} className="import-history-status-icon" />
        <select
          aria-label="Filter by status"
          value={statusValue}
          onChange={(e) => onStatusChange(e.target.value)}
          className="import-history-status-select"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <ChevronDown size={14} className="import-history-status-chevron" />
      </div>

      <span className="import-history-results-label">{resultsLabel}</span>
    </div>
  );
}