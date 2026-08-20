// ============================================================
// ImportData.tsx
// ------------------------------------------------------------
// Stays close to the original "dumb page" pattern: layout only,
// real logic lives in the child components. CHANGED: expectedColumns
// and lastImport no longer come from mockImportData - they're fetched
// from the backend on mount. `importSteps` (the step LABELS) is kept
// from mockImportData since those are static UI copy, not data, and
// I don't have visibility into your exact step wording to safely
// replace it - only what actually needed real data was touched.
// ============================================================

import { useEffect, useState } from 'react';

import ImportSteps from '../components/ImportData/ImportSteps';
import FileUpload from '../components/ImportData/FileUpload';
import SecurityBanner from '../components/ImportData/SecurityBanner';
import LastImport from '../components/ImportData/LastImport';
import ExpectedColumns from '../components/ImportData/ExpectedColumns';

import { importSteps } from '../data/mockImportData';
import { getExpectedColumns, getLatestImport } from '../services/importService';
import type { ImportResult } from '../services/importService';
import type { ExpectedColumn, LastImportInfo } from '../types/importData';

import '../styles/ImportData.css';

export default function ImportData() {
  // mockImportData.ts confirms there are 4 steps (Upload File ->
  // Automated Validation -> Mapping & Review -> Final Sync), so 5 marks
  // all four complete on a finished import - no more guessing needed.
  const [currentStep, setCurrentStep] = useState(1);
  const [expectedColumns, setExpectedColumns] = useState<ExpectedColumn[]>([]);
  const [lastImport, setLastImport] = useState<LastImportInfo | null>(null);

  useEffect(() => {
    getExpectedColumns()
      .then(setExpectedColumns)
      .catch(() => {
        // Panel just stays empty on failure - not critical to the page.
      });
    refreshLastImport();
  }, []);

  async function refreshLastImport() {
    try {
      const latest = await getLatestImport();
      setLastImport(latest);
    } catch {
      // Card stays hidden (see the conditional render below) on failure.
    }
  }

  function handleImportStart() {
    setCurrentStep(2);
  }

  function handleImportComplete(_result: ImportResult) {
    setCurrentStep(5);
    refreshLastImport();
  }

  function handleImportError() {
    setCurrentStep(1);
  }

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
        <ImportSteps steps={importSteps} currentStep={currentStep} />
      </div>

      {/* File upload */}
      <FileUpload
        onImportStart={handleImportStart}
        onImportComplete={handleImportComplete}
        onImportError={handleImportError}
      />

      {/* Security banner */}
      <SecurityBanner />

      {/* Last import - hidden entirely until there's a real one to show */}
      {lastImport && <LastImport data={lastImport} />}

      {/* Expected columns */}
      <ExpectedColumns columns={expectedColumns} />
    </div>
  );
}