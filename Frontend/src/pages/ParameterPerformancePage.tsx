// ============================================================
// ParameterPerformancePage.tsx
// ------------------------------------------------------------
// Same architecture as DepartmentDashboard.tsx:
//
//   selectedDepartment (state)
//         ↓
//   departmentParameterData[selectedDepartment]
//         ↓
//   summary cards / breakdown table / distribution / insights
//
// The initial department comes from React Router's navigation
// `state` (passed by DepartmentDashboard.tsx's "View Detailed
// Breakdown" button) when available, so arriving from Marketing's
// dashboard opens this page already on Marketing — WITHOUT putting
// the department name in the URL, per the spec.
// ============================================================

import { useState } from 'react';
import { useLocation } from 'react-router-dom';

import Breadcrumb from '../components/Breadcrumb';
import DepartmentFilters from '../components/DepartmentDashboard/DepartmentFilters';
import ParameterSummaryCards from '../components/ParameterPerformancePage/ParameterSummaryCards';
import ParameterBreakdownTable from '../components/ParameterPerformancePage/ParameterBreakdownTable';
import AchievementDistributionCard from '../components/ParameterPerformancePage/AchievementDistributionCard';
import OperationalInsightsCard from '../components/ParameterPerformancePage/OperationalInsightsCard';

import { departmentParameterData } from '../data/departmentParameterData';
import { ALL_DEPARTMENTS, type DepartmentKey } from '../types/departmentDashboard';
import type { ParameterBreakdownRow } from '../types/departmentParameter';

import '../styles/FundingDashboard.css';

const YEARS = ['2024', '2025', '2026'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function isDepartmentKey(value: unknown): value is DepartmentKey {
  return typeof value === 'string' && (ALL_DEPARTMENTS as readonly string[]).includes(value);
}

export default function ParameterPerformancePage() {
  const location = useLocation();
  // location.state is `unknown` by design in React Router — we
  // narrow it carefully rather than trusting it, since it could be
  // missing (direct navigation to this URL) or malformed.
  const incomingDepartment = (location.state as { department?: unknown } | null)?.department;
  const initialDepartment = isDepartmentKey(incomingDepartment) ? incomingDepartment : 'Funding';

  const [department, setDepartment] = useState<DepartmentKey>(initialDepartment);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('June');
  const [parameter, setParameter] = useState('All Parameters');

  const data = departmentParameterData[department];

  const parameterOptions = ['All Parameters', ...data.rows.map((row: ParameterBreakdownRow) => row.parameter)];

  function handleExport() {
    console.log('Export requested', { department, year, month, parameter });
  }

  function handleViewRowDetails(row: ParameterBreakdownRow) {
    // Wired for future functionality per the spec — no detail page
    // exists yet, so this is intentionally just a log for now.
    console.log('View parameter details requested', row.id);
  }

  return (
    <div className="funding-dashboard-page">
      <Breadcrumb
        items={[
          { label: "Dashboard", to: "/dashboard" },
          { label: "Departments" },
          { label: department },
        ]}
      />

      <div>
        <h1 className="page-title">Detailed Parameter Performance</h1>
        <p className="page-subtitle">
          Granular analysis of individual {department.toLowerCase()} channels
          and responsible leads.
        </p>
      </div>

      <DepartmentFilters
        options={{
          departments: [...ALL_DEPARTMENTS],
          years: YEARS,
          months: MONTHS,
          parameters: parameterOptions,
        }}
        department={department}
        onDepartmentChange={(value) => {
          if (isDepartmentKey(value)) setDepartment(value);
        }}
        year={year}
        onYearChange={setYear}
        month={month}
        onMonthChange={setMonth}
        parameter={parameter}
        onParameterChange={setParameter}
        onExport={handleExport}
      />

      <ParameterSummaryCards summary={data.summary} />

      <ParameterBreakdownTable
        department={department}
        rows={data.rows}
        onViewDetails={handleViewRowDetails}
      />

      <div className="param-bottom-row">
        <AchievementDistributionCard data={data.achievementDistribution} />
        <OperationalInsightsCard insights={data.operationalInsights} />
      </div>
    </div>
  );
}