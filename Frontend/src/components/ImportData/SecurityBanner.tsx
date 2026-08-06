// ============================================================
// SecurityBanner.tsx
// ------------------------------------------------------------
// Small, static informational banner. No props needed since the
// text never changes — kept as its own component purely so
// ImportData.tsx stays readable as a list of sections.
// ============================================================

import { ShieldCheck } from 'lucide-react';

export default function SecurityBanner() {
  return (
    <div className="security-banner">
      <ShieldCheck size={16} className="security-banner-icon" />
      <div>
        <div className="security-banner-title">Enterprise Security Active</div>
        <div className="security-banner-text">
          All uploaded data is encrypted in transit and at rest. Access is restricted based on
          your role permissions.
        </div>
      </div>
    </div>
  );
}