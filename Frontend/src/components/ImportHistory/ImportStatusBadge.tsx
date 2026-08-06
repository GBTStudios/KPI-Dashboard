// ============================================================
// ImportStatusBadge.tsx
// ------------------------------------------------------------
// Small, focused component: given a status, render the right
// pill. Kept separate from ImportHistoryTable so the same badge
// could be reused elsewhere later (e.g. a detail view) without
// duplicating the icon/color logic.
//
// Accessibility note: status is communicated by TEXT ("Completed"
// / "Failed"), not just color — so it still reads correctly for
// colorblind users or anyone using a screen reader.
// ============================================================

import { CircleCheck, CircleAlert } from 'lucide-react';
import type { ImportStatus } from '../../types/importHistory';

interface ImportStatusBadgeProps {
  status: ImportStatus;
}

export default function ImportStatusBadge({ status }: ImportStatusBadgeProps) {
  if (status === 'completed') {
    return (
      <span className="import-status-badge import-status-completed">
        <CircleCheck size={13} />
        Completed
      </span>
    );
  }

  return (
    <span className="import-status-badge import-status-failed">
      <CircleAlert size={13} />
      Failed
    </span>
  );
}