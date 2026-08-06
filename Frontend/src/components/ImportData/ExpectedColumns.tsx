// ============================================================
// ExpectedColumns.tsx
// ============================================================

import type { ExpectedColumn } from '../../types/importData';

interface ExpectedColumnsProps {
  columns: ExpectedColumn[];
}

export default function ExpectedColumns({ columns }: ExpectedColumnsProps) {
  return (
    <div className="expected-columns-card">
      <div className="expected-columns-title">Expected Columns</div>
      <div className="expected-columns-subtitle">
        Make sure your spreadsheet includes these before uploading
      </div>

      <div className="expected-columns-list">
        {columns.map((column) => (
          <span className="expected-column-pill" key={column.label}>
            {column.label}
          </span>
        ))}
      </div>
    </div>
  );
}