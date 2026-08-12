// ============================================================
// Breadcrumb.tsx
// ------------------------------------------------------------
// A shared component (not Funding-specific) since every future
// department page will need the same "Dashboard / Departments /
// X" pattern.
//
// Each item is `{ label: string; to?: string }`. `to` is optional
// on purpose: an item WITH `to` renders as a real <Link> (clickable,
// navigates); an item WITHOUT `to` renders as plain text — used for
// "Departments" (no page of its own, just a sidebar dropdown) and
// for whatever the CURRENT page is (by convention, the last
// breadcrumb never links to itself).
// ============================================================

import { Link } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.label} className="breadcrumb-segment">
          {item.to ? (
            <Link to={item.to} className="breadcrumb-link">
              {item.label}
            </Link>
          ) : (
            <span className="breadcrumb-current">{item.label}</span>
          )}
          {index < items.length - 1 && <span className="breadcrumb-separator">/</span>}
        </span>
      ))}
    </nav>
  );
}