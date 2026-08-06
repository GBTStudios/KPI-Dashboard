// Renders the table itself. `records` is just ImportRecord[] —
// today the page passes an empty array `[]`, so this always
// renders the empty state. Once real API data flows in, the
// exact same component renders real rows, with no changes here.

import {
  Inbox,
  Trash2,
  FileText,
  CalendarDays,
  User,
} from 'lucide-react';
import type { ImportRecord } from '../../types/importHistory';
import ImportStatusBadge from './ImportStatusBadge';

interface ImportHistoryTableProps {
  records: ImportRecord[];
  onDelete?: (id: string) => void;
}

// Computes initials from a display name, same approach already
// used in Sidebar.tsx for the profile avatar — keeps the pattern
// consistent across the app instead of inventing a new one here.
function getInitials(name: string): string {
  return name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function ImportHistoryTable({ records, onDelete }: ImportHistoryTableProps) {
  return (
    <div className="import-history-table-card">
      <table className="import-history-table">
        <colgroup>
          <col style={{ width: '32%' }} />
          <col style={{ width: '18%' }} />
          <col style={{ width: '26%' }} />
          <col style={{ width: '14%' }} />
          <col style={{ width: '10%' }} />
        </colgroup>
      <thead>
  <tr>
    <th>
      <div className="import-table-header">
        <FileText size={16} />
        <span>File Name &amp; Metadata</span>
      </div>
    </th>

    <th>
      <div className="import-table-header">
        <CalendarDays size={16} />
        <span>Upload Date</span>
      </div>
    </th>

    <th>
      <div className="import-table-header">
        <User size={16} />
        <span>Uploader</span>
      </div>
    </th>

    <th>Status</th>

    <th>Actions</th>
  </tr>
</thead>
        <tbody>
          {records.map((record) => (
            <tr key={record.id}>
              <td>
                <div className="import-file-name">{record.fileName}</div>
                <div className="import-file-meta">
                  <span className="import-file-code">{record.fileCode}</span>
                  <span> • {record.fileSize}</span>
                  <span> • {record.rows.toLocaleString()} rows</span>
                </div>
              </td>
              <td className="import-upload-date">{record.uploadDate}</td>
              <td>
                <div className="import-uploader">
                  <span className="import-uploader-avatar">
                    {getInitials(record.uploaderName)}
                  </span>
                  <div>
                    <div className="import-uploader-name">{record.uploaderName}</div>
                    <div className="import-uploader-email">{record.uploaderEmail}</div>
                  </div>
                </div>
              </td>
              <td>
                <ImportStatusBadge status={record.status} />
              </td>
              <td>
                <button
                  type="button"
                  className="import-delete-btn"
                  aria-label="Delete import"
                  onClick={() => onDelete?.(record.id)}
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Empty state: rendered OUTSIDE <table> (not as a <tr>) so it
          can center itself freely and doesn't fight table layout rules. */}
      {records.length === 0 && (
        <div className="import-history-empty">
          <Inbox size={32} className="import-history-empty-icon" />
          <div className="import-history-empty-title">No import history yet</div>
          <div className="import-history-empty-text">
            Your uploaded files will appear here once imports are processed.
          </div>
        </div>
      )}
    </div>
  );
}