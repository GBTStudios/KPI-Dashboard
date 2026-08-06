import type { ImportStep, ExpectedColumn, LastImportInfo } from '../types/importData';

export const importSteps: ImportStep[] = [
  { id: 1, label: 'Upload File' },
  { id: 2, label: 'Automated Validation' },
  { id: 3, label: 'Mapping & Review' },
  { id: 4, label: 'Final Sync' },
];

export const expectedColumns: ExpectedColumn[] = [
  { label: 'Departments' },
  { label: 'Parameters' },
  { label: 'Person Responsible' },
  { label: 'Indicators' },
  { label: 'Annual Target' },
  { label: 'Map' },
];

export const lastImport: LastImportInfo = {
  name: 'kpi',
  syncedLabel: 'synced 2 days ago',
  status: 'Synced',
};