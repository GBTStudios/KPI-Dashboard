// ============================================================
// DepartmentDashboard.tsx
// ------------------------------------------------------------
// IMPORTANT — file naming: save this as exactly
//   src/pages/DepartmentDashboard.tsx
// and make sure these also match exactly on disk:
//   src/components/DepartmentDashboard/DepartmentFilters.tsx
//   src/types/departmentDashboard.ts
// If you still have typo'd versions (DeparmentDashboard.tsx,
// DepartmentFiters.tsx, deparmentDashboard.ts) sitting alongside
// the correct ones, delete them — having both is what caused the
// "Cannot find module" / stale-props confusion.
// ============================================================

import { useState } from 'react';

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

import { departmentDashboardData } from '../data/departmentDashboardData';
import { ALL_DEPARTMENTS, type DepartmentKey } from '../types/departmentDashboard';

import '../styles/FundingDashboard.css';

const YEARS = ['2024', '2025', '2026'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DEFAULT_DEPARTMENT: DepartmentKey = 'Program';

export default function DepartmentDashboard() {
  const [department, setDepartment] = useState<DepartmentKey>(DEFAULT_DEPARTMENT);
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('June');
  const [parameter, setParameter] = useState('All Parameters');

  const data = departmentDashboardData[department];

  const parameterOptions = [
    'All Parameters',
    ...data.parameterPerformance.map((item) => item.name),
  ];

  function handleDepartmentChange(next: DepartmentKey) {
    setDepartment(next);
    setParameter('All Parameters');
  }

  function handleExport() {
    console.log('Export requested', { department, year, month, parameter });
  }

  function handleViewAllKpis() {
    console.log('View all KPIs requested', department);
  }

  function handleViewDetailedBreakdown() {
    console.log('View detailed parameter breakdown requested', department);
  }

  function handleViewAllActivity() {
    console.log('View all activity requested', department);
  }

  return (
    <div className="funding-dashboard-page">
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Departments' },
          { label: department },
        ]}
      />

      <div>
        {/* Falls back to the generic template text unless a
            department (like Monitoring and Evaluation) explicitly
            overrides it via pageTitle/pageSubtitle. */}
        <h1 className="page-title">{data.pageTitle ?? `${department} Department Dashboard`}</h1>
        <p className="page-subtitle">
          {data.pageSubtitle ?? `Track and analyze performance for all ${department} department KPIs.`}
        </p>
      </div>

      <DepartmentFilters
        options={{
          departments: ALL_DEPARTMENTS,
          years: YEARS,
          months: MONTHS,
          parameters: parameterOptions,
        }}
        department={department}
        onDepartmentChange={handleDepartmentChange}
        year={year}
        onYearChange={setYear}
        month={month}
        onMonthChange={setMonth}
        parameter={parameter}
        onParameterChange={setParameter}
        onExport={handleExport}
      />

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