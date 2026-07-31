import SummaryCards from '../components/KpiDashboard/SummaryCards';
import MapPerformanceChart from '../components/KpiDashboard/MapPerformanceChart';
import DepartmentPerformance from '../components/KpiDashboard/DepartmentPerformance';
import DashboardFilters from '../components/KpiDashboard/DashboardFilters';
import KpiTable from '../components/KpiDashboard/KpiTable';
import AnnualProgress from '../components/KpiDashboard/AnnualProgress';
import RecentActivity from '../components/KpiDashboard/RecentActivity';

import {
  summaryCards,
  mapPerformanceData,
  departmentPerformance,
  filterOptions,
  kpiTableData,
  annualProgress,
  recentActivity,
} from '../data/mockDashboardData';

import '../styles/Dashboard.css';

export default function Dashboard() {
  return (
    <div className="dashboard">
      {/* 1. Summary Cards */}
      <SummaryCards cards={summaryCards} />

      {/* 2. Charts Section */}
      <div className="charts-section">
        <MapPerformanceChart data={mapPerformanceData} />
        <DepartmentPerformance data={departmentPerformance} />
      </div>

      {/* 3. Filters */}
      <DashboardFilters options={filterOptions} />

      {/* 4. KPI Table */}
      <KpiTable rows={kpiTableData} />

      {/* 5. Bottom Section */}
      <div className="bottom-section">
        <AnnualProgress data={annualProgress} />
        <RecentActivity items={recentActivity} />
      </div>
    </div>
  );
}