// ============================================================
// ImportData.tsx
// ------------------------------------------------------------
// Same pattern as Dashboard.tsx: this page stays "dumb" — it
// imports mock data and section components, and just lays them
// out in order. All real logic (upload state, validation, step
// tracking) lives inside the individual components.
// ============================================================

import ImportSteps from '../components/ImportData/ImportSteps';
import FileUpload from '../components/ImportData/FileUpload';
import SecurityBanner from '../components/ImportData/SecurityBanner';
import LastImport from '../components/ImportData/LastImport';
import ExpectedColumns from '../components/ImportData/ExpectedColumns';

import { importSteps, expectedColumns, lastImport } from '../data/mockImportData';

import '../styles/ImportData.css';

export default function ImportData() {
  return (
    <div className="import-data-page">
      {/* Page heading */}
      <div>
        <h1 className="page-title">Import Performance Data</h1>
        <p className="page-subtitle">
          Transform your raw Excel spreadsheets into interactive organizational KPIs. Upload your
          files to begin the validation and mapping process.
        </p>
      </div>

      {/* How it works */}
      <div>
        <h2 className="section-title">How it works</h2>
        {/* currentStep is hardcoded to 1 for now — wire this to real
            upload progress later without changing ImportSteps itself. */}
        <ImportSteps steps={importSteps} currentStep={1} />
      </div>

      {/* File upload */}
      <FileUpload />

      {/* Security banner */}
      <SecurityBanner />

      {/* Last import */}
      <LastImport data={lastImport} />

      {/* Expected columns */}
      <ExpectedColumns columns={expectedColumns} />
    </div>
  );
}