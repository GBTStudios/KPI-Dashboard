// ============================================================
// LastImport.tsx
// ------------------------------------------------------------
// NEW CONCEPT: <Link> from react-router-dom.
// A normal <a href="..."> would reload the whole page. <Link>
// intercepts the click and lets React Router swap pages WITHOUT
// a full browser reload — that's what makes React apps feel fast.
//
// NOTE: "/import-history" is already used as a nav item in your
// Sidebar, but there's no matching <Route> for it in App.tsx yet
// (I checked). Until that route + page exist, this link will hit
// your catch-all route and redirect to /dashboard. That's expected
// for now — once you build the Import History page, this will
// just start working with no changes needed here.
// ============================================================

import { Link } from 'react-router-dom';
import type { LastImportInfo } from '../../types/importData';

interface LastImportProps {
  data: LastImportInfo;
}

export default function LastImport({ data }: LastImportProps) {
  return (
    <div className="last-import">
      <div className="last-import-info">
        <span className="last-import-label">Last Import</span>
        <span className="last-import-name">{data.name}</span>
        <span className="last-import-synced">{data.syncedLabel}</span>
      </div>

      <span className="last-import-status">{data.status}</span>

      <Link to="/import-history" className="last-import-link">
        View import history
      </Link>
    </div>
  );
}