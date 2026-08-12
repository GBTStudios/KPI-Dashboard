import { useState } from 'react';

import Breadcrumb from '../components/Breadcrumb';
import FundingFilters from '../components/FundingDashboard/FundingFilters';
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
  fundingFilterOptions,
  fundingSummaryCards,
  monthlyTrendData,
  parameterPerformance,
  kpiOverviewRows,
  heatmapRows,
  annualTargetProgress,
  monthlyComparison,
  kpiAlerts,
  fundingRecentActivity,
} from '../data/fundingDashboardData';

import '../styles/FundingDashboard.css';

export default function FundingDashboard() {
  const [department, setDepartment] = useState('Funding');
  const [year, setYear] = useState('2026');
  const [month, setMonth] = useState('June');
  const [parameter, setParameter] = useState('All Parameters');

  function handleExport() {
    console.log('Export requested', { department, year, month, parameter });
  }

  function handleViewAllKpis() {
    console.log('View all KPIs requested');
  }

  function handleViewDetailedBreakdown() {
    console.log('View detailed parameter breakdown requested');
  }

  function handleViewAllActivity() {
    console.log('View all activity requested');
  }

  return (
    <div className="funding-dashboard-page">
      <Breadcrumb
        items={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Departments' },
          { label: 'Funding' },
        ]}
      />

      <div>
        <h1 className="page-title">Funding Department Dashboard</h1>
        <p className="page-subtitle">
          Track and analyze performance for all Funding department KPIs.
        </p>
      </div>

      <FundingFilters
        options={fundingFilterOptions}
        department={department}
        onDepartmentChange={setDepartment}
        year={year}
        onYearChange={setYear}
        month={month}
        onMonthChange={setMonth}
        parameter={parameter}
        onParameterChange={setParameter}
        onExport={handleExport}
      />

      <FundingSummaryCards cards={fundingSummaryCards} />

      <div className="funding-charts-row">
        <MonthlyPerformanceChart data={monthlyTrendData} />
        <ParameterPerformance items={parameterPerformance} onViewDetails={handleViewDetailedBreakdown} />
      </div>

      <div className="funding-mid-row">
        <KpiPerformanceTable rows={kpiOverviewRows} onViewAll={handleViewAllKpis} />
        <PerformanceHeatmap rows={heatmapRows} />
      </div>

      <div className="funding-bottom-row">
        <AnnualTargetProgress data={annualTargetProgress} />
        <MonthlyComparison items={monthlyComparison} />
        <KpiAlerts alerts={kpiAlerts} />
        <RecentActivity items={fundingRecentActivity} onViewAll={handleViewAllActivity} />
      </div>
    </div>
  );
}