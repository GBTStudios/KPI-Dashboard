// ============================================================
// DepartmentDashboard.tsx
// ------------------------------------------------------------
// CHANGED: no longer reads from ../data/departmentDashboardData (the
// hardcoded mock, one entry per DepartmentKey). Departments, and the
// dashboard data itself, now come from the backend via
// services/departmentDashboardService.ts - see that file for the
// snake_case -> camelCase field mapping.
//
// REQUIRED FOLLOW-UP: DepartmentFilters.tsx's props are still typed
// against DepartmentKey (a fixed 7-value union from
// types/departmentDashboard.ts). That union no longer matches reality -
// departments are now whatever rows exist in the `departments` table,
// not a fixed compile-time list. `department`/`onDepartmentChange`/
// `options.departments` in DepartmentFilters.tsx need to be retyped as
// `string` (not `DepartmentKey`) or this file won't type-check against
// it. I didn't rewrite that component here since it wasn't asked for
// this round - say the word and I'll do that pass too.
//
// CHANGED: handleViewDetailedBreakdown now navigates to
// /department-dashboard/parameters instead of just logging. The
// currently-selected department is passed via React Router's
// `navigate(path, { state })` — NOT a URL param — so the new page
// opens already showing the right department without the URL ever
// containing a department name (per that page's spec). Passes
// `departmentName` (the backend department's display name) in the
// `department` state key, since the receiving page expects that same
// key from before - only the VALUE's source changed, from a
// DepartmentKey union member to this dynamic department's name.
// ============================================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Breadcrumb from '../components/Breadcrumb';
import DepartmentFilters from '../components/DepartmentDashboard/DepartmentFilters';
import FundingSummaryCards from '../components/FundingDashboard/FundingSummaryCards';
import MonthlyPerformanceChart from '../components/FundingDashboard/MonthlyPerformanceChart';
import ParameterPerformance from '../components/FundingDashboard/ParameterPerformance';
import KpiPerformanceTable from '../components/FundingDashboard/KpiPerformanceTable';
import PerformanceHeatmap from '../components/FundingDashboard/PerformanceHeatmap';
import AnnualTargetProgress from '../components/FundingDashboard/AnnualTargetProgress';
import MonthlyComparison from '../components/FundingDashboard/MonthlyComparison';
import KpiAlerts from '../components/FundingDashboard/KpiAlerts';
import RecentActivity from '../components/FundingDashboard/RecentActivity';

import {
  listDepartments,
  getDepartmentDashboard,
  type DepartmentOption,
  type DepartmentDashboardData,
} from '../services/departmentDashboardService';

import '../styles/FundingDashboard.css';

const YEARS = ['2024', '2025', '2026'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// The page's dropdown shows full month names (unchanged design); the
// backend takes 3-letter months (see GetDepartmentDashboardParams in
// departmentDashboardService.ts) - converted right before each request.
const MONTH_TO_ABBR: Record<string, string> = {
  January: 'Jan', February: 'Feb', March: 'Mar', April: 'Apr',
  May: 'May', June: 'Jun', July: 'Jul', August: 'Aug',
  September: 'Sep', October: 'Oct', November: 'Nov', December: 'Dec',
};

export default function DepartmentDashboard() {
  const navigate = useNavigate();

  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('June');
  const [parameter, setParameter] = useState('All Parameters');

  const [data, setData] = useState<DepartmentDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Departments list - fetched once on mount, replaces the old hardcoded
  // ALL_DEPARTMENTS union. Defaults to the first one returned.
  useEffect(() => {
    listDepartments()
      .then((depts) => {
        setDepartments(depts);
        setDepartmentId((current) => current ?? depts[0]?.id ?? null);
      })
      .catch(() => setLoadError('Could not load departments.'));
  }, []);

  // Dashboard data - refetched whenever any filter changes. `cancelled`
  // guards against a slow request for a filter combination the user has
  // since navigated away from overwriting a newer one.
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
        if (!cancelled) setLoadError("Could not load this department's dashboard.");
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

  function handleViewAllKpis() {
    console.log('View all KPIs requested', departmentId);
  }

  function handleViewDetailedBreakdown() {
    navigate('/department-dashboard/parameters', { state: { department: departmentName } });
  }

  function handleViewAllActivity() {
    console.log('View all activity requested', departmentId);
  }

  if (isLoading && !data) {
    return (
      <div className="funding-dashboard-page">
        <p>Loading department dashboard...</p>
      </div>
    );
  }

  if (loadError && !data) {
    return (
      <div className="funding-dashboard-page">
        <p role="alert" style={{ color: '#b91c1c' }}>{loadError}</p>
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
        {/* Falls back to the generic template text unless the backend
            explicitly sends a pageTitle/pageSubtitle override for this
            department. */}
        <h1 className="page-title">{data.pageTitle ?? `${departmentName} Department Dashboard`}</h1>
        <p className="page-subtitle">
          {data.pageSubtitle ?? `Track and analyze performance for all ${departmentName} department KPIs.`}
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
        <p role="alert" style={{ color: '#b91c1c' }}>
          {loadError} (showing the last successfully loaded data)
        </p>
      )}

      <FundingSummaryCards cards={data.summaryCards} />

      <div className="funding-charts-row">
        <MonthlyPerformanceChart data={data.monthlyTrend} />
        <ParameterPerformance
          items={data.parameterPerformance}
          onViewDetails={handleViewDetailedBreakdown}
          subtitle="Performance by parameter"
        />
      </div>

      <div className="funding-mid-row">
        <KpiPerformanceTable rows={data.kpiOverviewRows} onViewAll={handleViewAllKpis} />
        <PerformanceHeatmap rows={data.heatmapRows} />
      </div>

      <div className="funding-bottom-row">
        <AnnualTargetProgress data={data.annualTargetProgress} />
        <MonthlyComparison items={data.monthlyComparison} />
        <KpiAlerts alerts={data.kpiAlerts} />
        <RecentActivity items={data.recentActivity} onViewAll={handleViewAllActivity} />
      </div>
    </div>
  );
}