// ============================================================
// KpiIndicatorsPage.tsx
// ------------------------------------------------------------
// CHANGED: no longer imports the hardcoded departmentDashboardData
// mock or ALL_DEPARTMENTS/DepartmentKey. Departments and dashboard
// data now come from services/departmentDashboardService.ts — the
// SAME service DepartmentDashboard.tsx uses, since kpiOverviewRows,
// heatmapRows, and summaryCards (needed for the Data Integrity
// card) are all already part of the DepartmentDashboardData that
// service returns. No new service file needed.
//
// The incoming department NAME still arrives via location.state
// (set by DepartmentDashboard.tsx's handleViewAllKpis — see the
// note at the bottom of this file about that). Since the backend
// keys departments by id, not name, the department list is fetched
// first and then matched by name — mirroring exactly how
// DepartmentDashboard.tsx's handleDepartmentChange resolves a name
// back to an id.
// ============================================================

import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

import Breadcrumb from '../components/Breadcrumb';
import DepartmentFilters from '../components/DepartmentDashboard/DepartmentFilters';
import KpiIndicatorsTable from '../components/KpiIndicatorsPage/KpiIndicatorsTable';
import KpiIndicatorsSummary from '../components/KpiIndicatorsPage/KpiIndicatorsSummary';

import {
  listDepartments,
  getDepartmentDashboard,
  type DepartmentOption,
  type DepartmentDashboardData,
} from '../services/departmentDashboardService';

import '../styles/FundingDashboard.css';
import '../styles/KpiIndicatorsPage.css';

const YEARS = ['2024', '2025', '2026'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Same full-name -> 3-letter conversion as DepartmentDashboard.tsx —
// the backend takes "Jun", the dropdown shows "June".
const MONTH_TO_ABBR: Record<string, string> = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
};

export default function KpiIndicatorsPage() {
  const location = useLocation();
  // location.state is `unknown` by design — narrowed carefully rather
  // than trusted, since direct navigation to this URL means no state
  // was ever set at all.
  const incomingDepartmentName =
    (location.state as { department?: unknown } | null)?.department;

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('June');
  const [parameter, setParameter] = useState('All Parameters');

  const [data, setData] = useState<DepartmentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Departments list — fetched once. Picks the department matching
  // whatever name arrived via navigation state; falls back to the
  // first department returned if that name isn't found (covers both
  // "opened this page directly" and "the passed name is stale").
  useEffect(() => {
    listDepartments()
      .then((depts) => {
        setDepartments(depts);
        const matched =
          typeof incomingDepartmentName === 'string'
            ? depts.find((d) => d.name === incomingDepartmentName)
            : undefined;
        setDepartmentId((current) => current ?? matched?.id ?? depts[0]?.id ?? null);
      })
      .catch(() => setLoadError('Could not load departments.'));
    // Deliberately runs once on mount only — see DepartmentDashboard.tsx
    // for the same pattern and reasoning.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dashboard data — refetched whenever any filter changes.
  useEffect(() => {
    if (!departmentId) return;
    let cancelled = false;
    setIsLoading(true);
    setLoadError(null);

    getDepartmentDashboard({
      departmentId,
      year,
      month: MONTH_TO_ABBR[month],
      parameter,
    })
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Could not load this department's KPIs.");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [departmentId, year, month, parameter]);

  const selectedDepartment = departments.find((d) => d.id === departmentId);
  const departmentName = selectedDepartment?.name ?? '';

  const parameterOptions = [
    'All Parameters',
    ...(data?.parameterPerformance.map((item) => item.name) ?? []),
  ];

  function handleDepartmentChange(nextName: string) {
    const match = departments.find((d) => d.name === nextName);
    if (match) {
      setDepartmentId(match.id);
      setParameter('All Parameters');
    }
  }

  function handleExport() {
    console.log('Export requested', { departmentId, year, month, parameter });
  }

  if (isLoading && !data) {
    return (
      <div className="funding-dashboard-page">
        <p>Loading KPIs...</p>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="funding-dashboard-page">
        <p role="alert" className="kpi-load-error">
          {loadError}
        </p>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="funding-dashboard-page">
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Departments' },
          { label: departmentName },
        ]}
      />

      <div>
        <h1 className="page-title">All {departmentName} KPIs</h1>
        <p className="page-subtitle">
          Comprehensive list of performance indicators for the {departmentName} department.
        </p>
      </div>

      <DepartmentFilters
        options={{
          departments: departments.map((d) => d.name),
          years: YEARS,
          months: MONTHS,
          parameters: parameterOptions,
        }}
        department={departmentName}
        onDepartmentChange={handleDepartmentChange}
        year={year}
        onYearChange={setYear}
        month={month}
        onMonthChange={setMonth}
        parameter={parameter}
        onParameterChange={setParameter}
        onExport={handleExport}
      />

      {loadError && (
        <p role="alert" className="kpi-load-error">
          {loadError} (showing the last successfully loaded data)
        </p>
      )}

      <KpiIndicatorsTable
        department={departmentName}
        rows={data.kpiOverviewRows}
        heatmapRows={data.heatmapRows}
      />

      <KpiIndicatorsSummary summaryCards={data.summaryCards} />
    </div>
  );
}

// --------------------------------------------------------------
// REQUIRED FOLLOW-UP for DepartmentDashboard.tsx
// ------------------------------------------------------------
// The pasted version of DepartmentDashboard.tsx still has:
//
//   function handleViewAllKpis() {
//     console.log('View all KPIs requested', departmentId);
//   }
//
// This needs the same navigation treatment as
// handleViewDetailedBreakdown got:
//
//   function handleViewAllKpis() {
//     navigate('/department-dashboard/kpis', { state: { department: departmentName } });
//   }
//
// (departmentName, not departmentId — this page matches by name,
// same as the Parameter Performance page does.)
// --------------------------------------------------------------