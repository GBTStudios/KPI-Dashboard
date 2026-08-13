// Funding, Marketing, and Program are unchanged from the previous
// version of this file. Partnerships, Mentorship, Monitoring and
// Evaluation, and Guest Speakers have been rebuilt from the
// screenshots provided.
//
// A few adaptation notes, since several of these screenshots use
// a visibly different bottom-row layout (multi-row progress list,
// full comparison table, tag-style alerts) than Funding/Marketing's
// components:
//   - Reshaped into the EXISTING AnnualTargetProgress /
//     MonthlyComparison / KpiAlerts component shapes, same approach
//     used for Program earlier — one headline metric featured in
//     AnnualTargetProgress, 3 representative rows in
//     MonthlyComparison, converted alert language for KpiAlerts.
//   - Monitoring and Evaluation uses pageTitle/pageSubtitle
//     overrides since its screenshot has genuinely different copy
//     ("Monitoring & Evaluation Dashboard" / a survey-specific
//     subtitle) rather than the generic template text.
//   - Mentorship and Guest Speakers have NO alerts in their
//     screenshots — kpiAlerts is an empty array for both, which
//     KpiAlerts.tsx already handles (renders "0 items need
//     attention" and no alert rows).

import type { DepartmentDashboardData } from '../types/departmentDashboard';

const onTarget = (): { status: 'on-target' } => ({ status: 'on-target' });
const atRisk = (label: string): { status: 'at-risk'; valueLabel: string } => ({
  status: 'at-risk',
  valueLabel: label,
});
const belowTarget = (label: string): { status: 'below-target'; valueLabel: string } => ({
  status: 'below-target',
  valueLabel: label,
});

export const departmentDashboardData: DepartmentDashboardData = {
  // ==============================================================
  // FUNDING — unchanged
  // ==============================================================
  Funding: {
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '87%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs 81% last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 46, target: 50 }, { month: 'Feb', actual: 48, target: 52 },
      { month: 'Mar', actual: 58, target: 60 }, { month: 'Apr', actual: 64, target: 66 },
      { month: 'May', actual: 70, target: 74 }, { month: 'Jun', actual: 76, target: 78 },
      { month: 'Jul', actual: 79, target: 80 }, { month: 'Aug', actual: 83, target: 84 },
      { month: 'Sep', actual: 82, target: 88 }, { month: 'Oct', actual: 86, target: 89 },
      { month: 'Nov', actual: 88, target: 91 }, { month: 'Dec', actual: 91, target: 93 },
    ],
    parameterPerformance: [
      { name: 'Sponsorships', percentage: 94, color: '#1c9c6e' },
      { name: 'Grants', percentage: 81, color: '#e0a83e' },
      { name: 'Private Donors', percentage: 92, color: '#5575f2' },
      { name: 'Corporate Partners', percentage: 78, color: '#7c5cf0' },
    ],
    kpiOverviewRows: [
      { indicator: 'New Individual Donors', annualTarget: 53690, currentYtd: 31800, achievement: 126, status: 'On Target', trend: 'up' },
      { indicator: 'Existing Individual Donors', annualTarget: 220880, currentYtd: 105500, achievement: 105, status: 'On Target', trend: 'up' },
      { indicator: 'Program Grants Submitted', annualTarget: 48, currentYtd: 44, achievement: 91, status: 'Near Target', trend: 'up' },
      { indicator: 'Corporate Partner Conversations', annualTarget: 36, currentYtd: 10, achievement: 36, status: 'Below Target', trend: 'down' },
      { indicator: 'Grant Success Rate (%)', annualTarget: 65, currentYtd: 60, achievement: 92, status: 'On Target', trend: 'up' },
      { indicator: 'Quality of Fit (Program)', annualTarget: 40, currentYtd: 34, achievement: 85, status: 'Near Target', trend: 'up' },
    ],
    heatmapRows: [
      { indicator: 'New Individual Donors', cells: [onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Existing Individual Donors', cells: [onTarget(), onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Program Grants Submitted', cells: [onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), atRisk('88%'), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Corporate Partner Conversations', cells: [onTarget(), onTarget(), onTarget(), belowTarget('72%'), atRisk('88%'), onTarget(), atRisk('88%'), belowTarget('40%'), belowTarget('69%'), belowTarget('30%'), belowTarget('20%'), onTarget()] },
      { indicator: 'Grant Success Rate (%)', cells: [onTarget(), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Quality of Fit (Program)', cells: [onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: '700,000 EUR', currentLabel: '612,450 EUR', percentage: 87.5, remainingLabel: '87,550 EUR', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Donations', changeLabel: '+12.4%', direction: 'up' },
      { label: 'Grant Success', changeLabel: '-2.1%', direction: 'down' },
      { label: 'Lead Volume', changeLabel: '+5.8%', direction: 'up' },
    ],
    kpiAlerts: [
      { id: 'funding-alert-1', title: 'Grant Submission Rate', description: 'Currently 15% below threshold', tone: 'danger' },
      { id: 'funding-alert-2', title: 'Review Pending', description: 'Sponsorship audit due in 2 days', tone: 'warning' },
      { id: 'funding-alert-3', title: 'Corporate Partner Conversations', description: 'Tracking 64% below target for June', tone: 'danger' },
    ],
    recentActivity: [
      { id: 'funding-activity-1', actor: 'Mary Precious', action: 'submitted Grant Success Rate KPI', timestamp: 'Today, 09:40 AM' },
      { id: 'funding-activity-2', actor: 'John Doe', action: 'updated New Individual Donors data', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'funding-activity-3', actor: 'Maria Garcia', action: 'resolved Below Target alert', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },

  // ==============================================================
  // MARKETING — unchanged
  // ==============================================================
  Marketing: {
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '87%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs 81% last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 80, target: 100 }, { month: 'Feb', actual: 80, target: 100 },
      { month: 'Mar', actual: 160, target: 100 }, { month: 'Apr', actual: 155, target: 100 },
      { month: 'May', actual: 175, target: 100 }, { month: 'Jun', actual: 70, target: 100 },
      { month: 'Jul', actual: 95, target: 100 }, { month: 'Aug', actual: 95, target: 100 },
      { month: 'Sep', actual: 150, target: 100 }, { month: 'Oct', actual: 200, target: 100 },
      { month: 'Nov', actual: 150, target: 100 }, { month: 'Dec', actual: 100, target: 100 },
    ],
    parameterPerformance: [
      { name: 'Website', percentage: 163, color: '#1c9c6e' },
      { name: 'Social Media', percentage: 90, color: '#e0a83e' },
      { name: 'PR', percentage: 113, color: '#7c5cf0' },
      { name: 'Newsletter', percentage: 58, color: '#b3435a' },
    ],
    kpiOverviewRows: [
      { indicator: 'Sessions', annualTarget: 22000, currentYtd: 36169, achievement: 163, status: 'On Target', trend: 'up' },
      { indicator: 'LinkedIn Impressions', annualTarget: 220880, currentYtd: 105500, achievement: 105, status: 'On Target', trend: 'up' },
      { indicator: 'Referral Traffic (User)', annualTarget: 48, currentYtd: 44, achievement: 91, status: 'Near Target', trend: 'up' },
      { indicator: 'Open Rate (%)', annualTarget: 36, currentYtd: 10, achievement: 36, status: 'Below Target', trend: 'down' },
    ],
    heatmapRows: [
      { indicator: 'Sessions', cells: [onTarget(), onTarget(), onTarget(), atRisk('90%'), onTarget(), onTarget(), onTarget(), atRisk('90%'), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'LinkedIn Impressions', cells: [onTarget(), atRisk('88%'), onTarget(), atRisk('80%'), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Referral Traffic (User)', cells: [onTarget(), atRisk('90%'), onTarget(), onTarget(), atRisk('90%'), atRisk('88%'), onTarget(), atRisk('90%'), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Open Rate (%)', cells: [onTarget(), onTarget(), onTarget(), belowTarget('69%'), onTarget(), belowTarget('80%'), atRisk('88%'), belowTarget('69%'), belowTarget('20%'), belowTarget('20%'), belowTarget('30%'), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: '220,880 LinkedIn impressions', currentLabel: '105,500', percentage: 87.5, remainingLabel: '115,380', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Sessions', changeLabel: '+12.4%', direction: 'up' },
      { label: 'Open Rate', changeLabel: '-2.1%', direction: 'down' },
      { label: 'LinkedIn Impressions', changeLabel: '+5.8%', direction: 'up' },
    ],
    kpiAlerts: [
      { id: 'marketing-alert-1', title: 'Open Rate', description: 'Currently 15% below threshold', tone: 'danger' },
      { id: 'marketing-alert-2', title: 'Review Pending', description: 'Referral traffic due in 2 days', tone: 'warning' },
    ],
    recentActivity: [
      { id: 'marketing-activity-1', actor: 'Mary Precious', action: 'submitted Website traffic report', timestamp: 'Today, 09:40 AM' },
      { id: 'marketing-activity-2', actor: 'John Doe', action: 'updated Newsletter campaign data', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'marketing-activity-3', actor: 'Maria Garcia', action: 'resolved Below Target alert', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },

  // ==============================================================
  // PROGRAM — unchanged
  // ==============================================================
  Program: {
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '87%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 48, target: 80 }, { month: 'Feb', actual: 46, target: 80 },
      { month: 'Mar', actual: 44, target: 80 }, { month: 'Apr', actual: 62, target: 80 },
      { month: 'May', actual: 68, target: 80 }, { month: 'Jun', actual: 55, target: 80 },
      { month: 'Jul', actual: 60, target: 80 }, { month: 'Aug', actual: 78, target: 80 },
      { month: 'Sep', actual: 82, target: 80 }, { month: 'Oct', actual: 65, target: 80 },
      { month: 'Nov', actual: 70, target: 80 }, { month: 'Dec', actual: 76, target: 80 },
    ],
    parameterPerformance: [
      { name: 'Campus', percentage: 94, color: '#1c9c6e' },
      { name: 'Recruitment', percentage: 81, color: '#5575f2' },
      { name: 'Talent Retention', percentage: 92, color: '#7c5cf0' },
      { name: 'Job Placement', percentage: 78, color: '#e0a83e' },
      { name: 'Visibility', percentage: 89, color: '#1c5e59' },
    ],
    kpiOverviewRows: [
      { indicator: 'Electricity uptime days/month', annualTarget: 365, currentYtd: 341, achievement: 93, status: 'On Target', trend: 'up' },
      { indicator: 'Internet uptime days/month', annualTarget: 365, currentYtd: 329, achievement: 90, status: 'On Target', trend: 'up' },
      { indicator: 'Beds occupied', annualTarget: 900, currentYtd: 828, achievement: 92, status: 'Near Target', trend: 'up' },
      { indicator: 'Medical Cases', annualTarget: 900, currentYtd: 696, achievement: 77, status: 'Below Target', trend: 'down' },
      { indicator: '# Recruited', annualTarget: 65, currentYtd: 60, achievement: 92, status: 'On Target', trend: 'up' },
      { indicator: '# Recruitment Partners', annualTarget: 40, currentYtd: 34, achievement: 85, status: 'Near Target', trend: 'up' },
      { indicator: '# Applications', annualTarget: 320, currentYtd: 298, achievement: 93, status: 'On Target', trend: 'up' },
    ],
    heatmapRows: [
      { indicator: 'Electricity uptime', cells: [onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Internet uptime', cells: [onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Beds occupied', cells: [onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Medical Cases', cells: [onTarget(), onTarget(), onTarget(), belowTarget('72%'), atRisk('88%'), atRisk('88%'), onTarget(), onTarget(), belowTarget('69%'), onTarget(), onTarget(), onTarget()] },
      { indicator: '# Recruited', cells: [onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: '# Applications', cells: [onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: '320 Applications', currentLabel: '298', percentage: 93, remainingLabel: '22', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Electricity Uptime', changeLabel: '+5%', direction: 'up' },
      { label: 'Beds Occupied', changeLabel: '+3%', direction: 'up' },
      { label: '# Recruited', changeLabel: '+5%', direction: 'up' },
    ],
    kpiAlerts: [
      { id: 'program-alert-1', title: 'Medical Cases', description: '77% of target — below threshold', tone: 'danger' },
      { id: 'program-alert-2', title: 'Recruitment Partners', description: '85% of target — near target', tone: 'warning' },
      { id: 'program-alert-3', title: 'Job Placement', description: 'Declined 8% this period', tone: 'warning' },
    ],
    recentActivity: [
      { id: 'program-activity-1', actor: 'Mary Precious', action: 'submitted Campus KPIs', timestamp: 'Today, 09:40 AM' },
      { id: 'program-activity-2', actor: 'John', action: 'updated Recruitment KPIs', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'program-activity-3', actor: 'Keilar', action: 'submitted Visibility KPIs', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },

  // ==============================================================
  // PARTNERSHIPS — rebuilt from screenshot 1
  // ==============================================================
  Partnerships: {
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '88%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 48, target: 80 }, { month: 'Feb', actual: 46, target: 80 },
      { month: 'Mar', actual: 44, target: 80 }, { month: 'Apr', actual: 62, target: 80 },
      { month: 'May', actual: 78, target: 80 }, { month: 'Jun', actual: 55, target: 80 },
      { month: 'Jul', actual: 60, target: 80 }, { month: 'Aug', actual: 78, target: 80 },
      { month: 'Sep', actual: 80, target: 80 }, { month: 'Oct', actual: 65, target: 80 },
      { month: 'Nov', actual: 70, target: 80 }, { month: 'Dec', actual: 78, target: 80 },
    ],
    parameterPerformance: [
      { name: 'Invite only Donors', percentage: 94, color: '#1c9c6e' },
      { name: 'Sponsorships', percentage: 81, color: '#5575f2' },
    ],
    kpiOverviewRows: [
      { indicator: 'Meetings invite_only_donors', annualTarget: 365, currentYtd: 341, achievement: 93, status: 'On Target', trend: 'up' },
      { indicator: 'Confirmed invite_only_donors partnerships', annualTarget: 365, currentYtd: 329, achievement: 90, status: 'On Target', trend: 'up' },
      { indicator: 'Conversations with new potential private donors', annualTarget: 900, currentYtd: 828, achievement: 92, status: 'Near Target', trend: 'up' },
      { indicator: 'Funding from new individual donors', annualTarget: 900, currentYtd: 696, achievement: 77, status: 'Below Target', trend: 'down' },
      { indicator: 'Funding from existing individual donors', annualTarget: 65, currentYtd: 60, achievement: 92, status: 'On Target', trend: 'up' },
      { indicator: 'Funding from grants -50%', annualTarget: 40, currentYtd: 34, achievement: 85, status: 'Near Target', trend: 'up' },
      { indicator: 'Conversations with potential new corporate partners', annualTarget: 320, currentYtd: 298, achievement: 93, status: 'On Target', trend: 'up' },
    ],
    heatmapRows: [
      { indicator: 'Meetings invite_only_donors', cells: [onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Confirmed invite_only_donors partnerships', cells: [onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Conversations with new potential private donors', cells: [onTarget(), atRisk('88%'), onTarget(), atRisk('88%'), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Funding from new individual Donors', cells: [onTarget(), onTarget(), onTarget(), belowTarget('72%'), atRisk('88%'), atRisk('88%'), onTarget(), onTarget(), belowTarget('69%'), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Funding from existing individual donors', cells: [onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Funding from grants -50%', cells: [onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Conversations with potential new corporate partners', cells: [onTarget(), onTarget(), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget(), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: '320 corporate partner conversations', currentLabel: '298', percentage: 93, remainingLabel: '22', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Meetings (Invite-Only Donors)', changeLabel: '+5%', direction: 'up' },
      { label: 'Confirmed Partnerships', changeLabel: '+7%', direction: 'up' },
      { label: 'Funding — New Individual Donors', changeLabel: '+5%', direction: 'up' },
    ],
    kpiAlerts: [
      { id: 'partnerships-alert-1', title: 'Funding From New Individual Donors', description: '77% of target — below threshold', tone: 'danger' },
      { id: 'partnerships-alert-2', title: 'Funding From Grants -50%', description: '85% of target — near target', tone: 'warning' },
      { id: 'partnerships-alert-3', title: 'Funding From Existing Donors', description: 'Declined 8% this period', tone: 'warning' },
    ],
    recentActivity: [
      { id: 'partnerships-activity-1', actor: 'Mary Precious', action: 'submitted Sponsorships KPIs', timestamp: 'Today, 09:40 AM' },
      { id: 'partnerships-activity-2', actor: 'John', action: 'updated Invite-only Donors KPIs', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'partnerships-activity-3', actor: 'Maria', action: 'submitted Sponsorships KPIs', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },

  // ==============================================================
  // MENTORSHIP — rebuilt from screenshot 3. No alerts in this
  // screenshot, so kpiAlerts is intentionally an empty array.
  // ==============================================================
  Mentorship: {
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '87%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs 81% last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 48, target: 80 }, { month: 'Feb', actual: 46, target: 80 },
      { month: 'Mar', actual: 44, target: 80 }, { month: 'Apr', actual: 62, target: 80 },
      { month: 'May', actual: 78, target: 80 }, { month: 'Jun', actual: 55, target: 80 },
      { month: 'Jul', actual: 60, target: 80 }, { month: 'Aug', actual: 78, target: 80 },
      { month: 'Sep', actual: 80, target: 80 }, { month: 'Oct', actual: 65, target: 80 },
      { month: 'Nov', actual: 70, target: 80 }, { month: 'Dec', actual: 78, target: 80 },
    ],
    parameterPerformance: [
      { name: 'Mentors', percentage: 94, color: '#1c9c6e' },
    ],
    kpiOverviewRows: [
      { indicator: 'Mentors', annualTarget: 40, currentYtd: 29, achievement: 77, status: 'Below Target', trend: 'down' },
    ],
    heatmapRows: [
      { indicator: 'Mentors', cells: [onTarget(), atRisk('88%'), onTarget(), onTarget(), atRisk('88%'), atRisk('88%'), onTarget(), atRisk('88%'), belowTarget('68%'), onTarget(), onTarget(), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: 'Mentors', currentLabel: '92%', percentage: 92, remainingLabel: '8%', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Mentors', changeLabel: '+7%', direction: 'up' },
    ],
    kpiAlerts: [],
    recentActivity: [
      { id: 'mentorship-activity-1', actor: 'Mary Precious', action: 'submitted Mentors KPIs', timestamp: 'Today, 09:40 AM' },
      { id: 'mentorship-activity-2', actor: 'John', action: 'updated Mentors KPIs', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'mentorship-activity-3', actor: 'Keilar', action: 'submitted Mentors KPIs', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },

  // ==============================================================
  // MONITORING AND EVALUATION — rebuilt from screenshot 2.
  // Uses pageTitle/pageSubtitle overrides (see file header note).
  // ==============================================================
  'Monitoring and Evaluation': {
    pageTitle: 'Monitoring & Evaluation Dashboard',
    pageSubtitle: 'Detailed response rates and survey performance analysis for the M&E department.',
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '87%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs 81% last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 80, target: 100 }, { month: 'Feb', actual: 80, target: 100 },
      { month: 'Mar', actual: 160, target: 100 }, { month: 'Apr', actual: 155, target: 100 },
      { month: 'May', actual: 175, target: 100 }, { month: 'Jun', actual: 70, target: 100 },
      { month: 'Jul', actual: 95, target: 100 }, { month: 'Aug', actual: 95, target: 100 },
      { month: 'Sep', actual: 150, target: 100 }, { month: 'Oct', actual: 200, target: 100 },
      { month: 'Nov', actual: 150, target: 100 }, { month: 'Dec', actual: 100, target: 100 },
    ],
    parameterPerformance: [
      { name: 'Surveys', percentage: 90, color: '#1c9c6e' },
    ],
    kpiOverviewRows: [
      { indicator: 'Response Rate Mentors', annualTarget: 22000, currentYtd: 36169, achievement: 163, status: 'On Target', trend: 'up' },
      { indicator: 'Response Rate Talents', annualTarget: 220880, currentYtd: 105500, achievement: 105, status: 'Near Target', trend: 'up' },
    ],
    heatmapRows: [
      { indicator: 'Response Rate Mentors', cells: [onTarget(), onTarget(), onTarget(), atRisk('90%'), onTarget(), onTarget(), belowTarget('53%'), atRisk('88%'), onTarget(), onTarget(), onTarget(), onTarget()] },
      { indicator: 'Response Rate Talents', cells: [belowTarget('72%'), atRisk('88%'), onTarget(), atRisk('80%'), atRisk('69%'), onTarget(), onTarget(), onTarget(), atRisk('90%'), onTarget(), onTarget(), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: 'Survey Participation', currentLabel: '87.5%', percentage: 87.5, remainingLabel: '20', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Response Rate Mentors', changeLabel: '+12.4%', direction: 'up' },
      { label: 'Response Rate Talents', changeLabel: '-2.1%', direction: 'down' },
    ],
    kpiAlerts: [
      { id: 'me-alert-1', title: 'Mentor Response Decline', description: 'Mentor responses have been below 40% target for 3 consecutive survey cycles (Apr - Jul).', tone: 'danger' },
      { id: 'me-alert-2', title: 'Survey Data Validation', description: 'All Talent survey data for October has been successfully audited and locked.', tone: 'success' },
    ],
    recentActivity: [
      { id: 'me-activity-1', actor: 'Mary Precious', action: 'submitted Survey Participation data', timestamp: 'Today, 09:40 AM' },
      { id: 'me-activity-2', actor: 'John Doe', action: 'updated Response Rate data', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'me-activity-3', actor: 'Maria Garcia', action: 'resolved a survey validation alert', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },

  // ==============================================================
  // GUEST SPEAKERS — rebuilt from screenshot 4. No alerts in this
  // screenshot either, so kpiAlerts is an empty array.
  // ==============================================================
  'Guest Speakers': {
    summaryCards: [
      { title: 'OVERALL ACHIEVEMENT', value: '87%', changeLabel: '+6%', changeDirection: 'up', supportingText: 'vs 81% last month', icon: 'TrendingUp', tone: 'primary' },
      { title: 'KPIS ON TARGET', value: '9 / 12', supportingText: '75% of total KPIs', icon: 'Target', tone: 'success' },
      { title: 'KPIS BELOW TARGET', value: '3', supportingText: '25% of total KPIs', icon: 'AlertCircle', tone: 'danger' },
      { title: 'DATA COMPLETION', value: '98%', supportingText: 'Updated for June, 2026', icon: 'CircleCheck', tone: 'neutral' },
    ],
    monthlyTrend: [
      { month: 'Jan', actual: 48, target: 80 }, { month: 'Feb', actual: 46, target: 80 },
      { month: 'Mar', actual: 44, target: 80 }, { month: 'Apr', actual: 62, target: 80 },
      { month: 'May', actual: 78, target: 80 }, { month: 'Jun', actual: 55, target: 80 },
      { month: 'Jul', actual: 60, target: 80 }, { month: 'Aug', actual: 78, target: 80 },
      { month: 'Sep', actual: 80, target: 80 }, { month: 'Oct', actual: 65, target: 80 },
      { month: 'Nov', actual: 70, target: 80 }, { month: 'Dec', actual: 78, target: 80 },
    ],
    parameterPerformance: [
      { name: 'Guest Speakers', percentage: 94, color: '#1c9c6e' },
    ],
    kpiOverviewRows: [
      { indicator: 'Guest Speaker', annualTarget: 900, currentYtd: 696, achievement: 77, status: 'Below Target', trend: 'down' },
    ],
    heatmapRows: [
      { indicator: 'Guest Speaker', cells: [onTarget(), atRisk('88%'), onTarget(), onTarget(), atRisk('88%'), atRisk('88%'), onTarget(), atRisk('88%'), belowTarget('68%'), onTarget(), onTarget(), onTarget()] },
    ],
    annualTargetProgress: { targetLabel: 'Guest Speaker', currentLabel: '92%', percentage: 92, remainingLabel: '8%', daysLeftLabel: '184 Days' },
    monthlyComparison: [
      { label: 'Guest Speaker', changeLabel: '+7%', direction: 'up' },
    ],
    kpiAlerts: [],
    recentActivity: [
      { id: 'guest-speakers-activity-1', actor: 'Mary Precious', action: 'submitted Guest Speaker KPIs', timestamp: 'Today, 09:40 AM' },
      { id: 'guest-speakers-activity-2', actor: 'John', action: 'updated Guest Speaker KPIs', timestamp: 'Yesterday, 04:12 PM' },
      { id: 'guest-speakers-activity-3', actor: 'Keilar', action: 'submitted Guest Speaker KPIs', timestamp: 'Jun 5, 2026, 10:15 AM' },
    ],
  },
};