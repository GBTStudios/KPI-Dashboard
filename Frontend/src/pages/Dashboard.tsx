// CHANGED: this page used to statically import everything from
// ../data/mockDashboardData. It now fetches from the real backend via
// dashboardService.fetchDashboard() and re-fetches whenever a filter
// changes. SummaryCards/MapPerformanceChart/DepartmentPerformance/
// AnnualProgress/RecentActivity are UNCHANGED - they still receive the
// exact same prop shapes they always did; only where those props come
// from is different. KpiTable now also gets monthALabel/monthBLabel so
// its column headers match whichever months are actually selected (see
// KpiTable.tsx).

import { useEffect, useState } from 'react';
import SummaryCards from '../components/KpiDashboard/SummaryCards';
import MapPerformanceChart from '../components/KpiDashboard/MapPerformanceChart';
import DepartmentPerformance from '../components/KpiDashboard/DepartmentPerformance';
import DashboardFilters from '../components/KpiDashboard/DashboardFilters';
import type { DashboardFilterValues } from '../components/KpiDashboard/DashboardFilters';
import KpiTable from '../components/KpiDashboard/KpiTable';
import AnnualProgress from '../components/KpiDashboard/AnnualProgress';
import RecentActivity from '../components/KpiDashboard/RecentActivity';

import { fetchDashboard } from '../services/dashboardService';
import type { DashboardViewModel } from '../services/dashboardService';
import { ApiError } from '../services/api';

import '../styles/Dashboard.css';

const currentYear = new Date().getFullYear();

export default function Dashboard() {
  const [filters, setFilters] = useState<DashboardFilterValues>({
    year: currentYear,
    monthA: 'May',
    monthB: 'Jun',
    department: 'All',
  });
  const [data, setData] = useState<DashboardViewModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const result = await fetchDashboard({
          year: filters.year,
          monthA: filters.monthA,
          monthB: filters.monthB,
          department: filters.department,
        });
        if (cancelled) return;
        setData(result);
        // Reconcile with the server's resolved defaults on first load
        // (e.g. before we know the real available years/months).
        setFilters((prev) => ({
          ...prev,
          year: result.year,
          monthA: result.monthA,
          monthB: result.monthB,
        }));
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not load the dashboard. Please try again.');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.year, filters.monthA, filters.monthB, filters.department]);

  if (error) {
    return (
      <div className="dashboard">
        <p role="alert" style={{ color: '#b91c1c' }}>
          {error}
        </p>
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="dashboard">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      {/* 1. Summary Cards */}
      <SummaryCards cards={data.summaryCards} />

      {/* 2. Charts Section */}
      <div className="charts-section">
        <MapPerformanceChart data={data.mapPerformanceData} />
        <DepartmentPerformance data={data.departmentPerformance} />
      </div>

      <div className="kpi-table-card">
        {/* Filters inside the table card */}
        <DashboardFilters options={data.filterOptions} values={filters} onChange={setFilters} />

        {/* Table */}
        <KpiTable rows={data.kpiTableData} monthALabel={filters.monthA} monthBLabel={filters.monthB} />
      </div>

      {/* 5. Bottom Section */}
      <div className="bottom-section">
        <AnnualProgress data={data.annualProgress} />
        <RecentActivity items={data.recentActivity} />
      </div>
    </div>
  );
}
