import type {
  SummaryCardData,
  MapPerformancePoint,
  DepartmentPerformanceData,
  KpiTableRow,
  AnnualProgressData,
  ActivityItem,
  FilterOptions,
} from '../types/dashboard';

// 1. Summary Cards
export const summaryCards: SummaryCardData[] = [
  {
    title: 'OVERALL ACHIEVEMENT',
    value: '83%',
    icon: 'TrendingUp',
  },
  {
    title: 'KPIS ON TRACK',
    value: '5 / 7',
    icon: 'BarChart3',
  },
  {
    title: 'KPIS BELOW TARGET',
    value: '2',
    icon: 'Activity',
  },
  {
    title: 'DEPARTMENTS IMPROVING',
    value: '4/7',
    description: '3 departments declined',
    icon: 'Users',
  },
];

// 2. Map Performance chart data (bar + target line)
export const mapPerformanceData: MapPerformancePoint[] = [
  { month: 'JAN', actual: 52, target: 45 },
  { month: 'FEB', actual: 60, target: 55 },
  { month: 'MAR', actual: 55, target: 60 },
  { month: 'APR', actual: 70, target: 68 },
  { month: 'MAY', actual: 90, target: 78 },
  { month: 'JUN', actual: 80, target: 88 },
];

// 3. Department Performance (horizontal bars)
export const departmentPerformance: DepartmentPerformanceData[] = [
  { department: 'Programs', percentage: 81, color: '#5575f2' },
  { department: 'Guest Speakers', percentage: 81, color: '#5575f2' },
  { department: 'Partnerships', percentage: 86, color: '#5575f2' },
  { department: 'Funding', percentage: 91, color: '#1c5e59' },
  { department: 'Mentorship', percentage: 95, color: '#1c5e59' },
  { department: 'Marketing', percentage: 64, color: '#df92eb' },
  { department: 'M & E', percentage: 63, color: '#df92eb' },
];

// 4. Filters
export const filterOptions: FilterOptions = {
  months: ['January', 'February', 'March', 'April', 'May', 'June'],
  departments: [
    'All',
    'Programs',
    'Guest Speakers',
    'Partnerships',
    'Funding',
    'Mentorship',
    'Marketing',
    'M & E',
  ],
};

// 5. KPI Table ("KPIs requiring attention")
export const kpiTableData: KpiTableRow[] = [
  {
    indicator: 'Internet uptime',
    department: 'Programs',
    may: 61,
    june: 89,
    change: 28,
    status: 'Near Target',
  },
  {
    indicator: 'Referral traffic',
    department: 'Marketing',
    may: 68,
    june: 45,
    change: -23,
    status: 'Below Target',
  },
  {
    indicator: 'Recruitment partners',
    department: 'Programs',
    may: 65,
    june: 61,
    change: -4,
    status: 'Below Target',
  },
  {
    indicator: 'Social engagement',
    department: 'Marketing',
    may: 78,
    june: 82,
    change: 4,
    status: 'Near Target',
  },
  {
    indicator: 'Electricity uptime',
    department: 'Programs',
    may: 89,
    june: 92,
    change: 3,
    status: 'On Target',
  },
  {
    indicator: 'Grant applications',
    department: 'Funding',
    may: 85,
    june: 88,
    change: 3,
    status: 'Near Target',
  },
];

// 6. Annual Target Progress (bottom-left)
export const annualProgress: AnnualProgressData[] = [
  { label: 'Internet uptime', percentage: 94, color: '#1c5e59' },
  { label: 'Electricity uptime', percentage: 97, color: '#1c5e59' },
  { label: 'Recruitment partners', percentage: 72, color: '#5575f2' },
  { label: 'Referral traffic', percentage: 56, color: '#df92eb' },
];

// 7. Recent Activity (bottom-right timeline)
export const recentActivity: ActivityItem[] = [
  {
    id: '1',
    actor: 'Mary Precious',
    action: 'submitted Programs KPIs',
    timestamp: 'Today, 09:40 AM',
  },
  {
    id: '2',
    actor: 'John',
    action: 'updated Marketing KPIs',
    timestamp: 'Yesterday, 04:12 PM',
  },
  {
    id: '3',
    actor: 'Admin',
    action: 'approved the June report',
    timestamp: 'Yesterday, 11:05 AM',
  },
  {
    id: '4',
    actor: 'Funding team',
    action: 'updated donor retention figures',
    timestamp: '2 days ago',
  },
];