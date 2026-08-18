// ============================================================
// DATA — Parameter Performance detail page, all 7 departments
// ------------------------------------------------------------
// Funding follows the attached screenshot closely. The other six
// use parameter/lead names consistent with what's already
// established in departmentDashboardData.ts (e.g. Marketing's
// Website/Social Media/PR/Newsletter), extended with a couple more
// rows each so "Load More Parameters" has something to demonstrate.
// ============================================================

import type { DepartmentParameterDataset } from '../types/departmentParameter';

export const departmentParameterData: DepartmentParameterDataset = {
  // ==============================================================
  // FUNDING — matches the screenshot
  // ==============================================================
  Funding: {
    summary: { averageAchievement: 86.4, totalParameters: 18, activeLeads: 12 },
    rows: [
      {
        id: 'funding-param-1', code: 'PRM-1002', parameter: 'Sponsorships - Individual',
        responsibleName: 'Mary Precious', responsibleRole: 'Funding Lead',
        annualTarget: 450000, actualValue: 423000,
        monthlyProgression: [40, 52, 60, 72, 84, 94], achievement: 94, status: 'on-target',
      },
      {
        id: 'funding-param-2', code: 'PRM-2002', parameter: 'Grants - Institutional',
        responsibleName: 'John Doe', responsibleRole: 'Grants Manager',
        annualTarget: 1200000, actualValue: 972000,
        monthlyProgression: [65, 78, 58, 74, 62, 81], achievement: 81, status: 'near-target',
      },
      {
        id: 'funding-param-3', code: 'PRM-3002', parameter: 'Private Donors - Major',
        responsibleName: 'Maria Garcia', responsibleRole: 'Philanthropy Officer',
        annualTarget: 800000, actualValue: 736000,
        monthlyProgression: [45, 58, 68, 78, 86, 92], achievement: 92, status: 'on-target',
      },
      {
        id: 'funding-param-4', code: 'PRM-4002', parameter: 'Corporate Partnerships',
        responsibleName: 'Sarah Jenkins', responsibleRole: 'Partnership Lead',
        annualTarget: 600000, actualValue: 468000,
        monthlyProgression: [68, 52, 62, 44, 58, 78], achievement: 78, status: 'below-target',
      },
      {
        id: 'funding-param-5', code: 'PRM-5002', parameter: 'Events & Campaigns',
        responsibleName: 'Michael Chen', responsibleRole: 'Events Coordinator',
        annualTarget: 250000, actualValue: 212500,
        monthlyProgression: [48, 56, 64, 72, 79, 85], achievement: 85, status: 'near-target',
      },
      {
        id: 'funding-param-6', code: 'PRM-6002', parameter: 'Digital Fundraising',
        responsibleName: 'Grace Kim', responsibleRole: 'Digital Fundraising Lead',
        annualTarget: 300000, actualValue: 285000,
        monthlyProgression: [55, 66, 74, 82, 90, 95], achievement: 95, status: 'on-target',
      },
      {
        id: 'funding-param-7', code: 'PRM-7002', parameter: 'Legacy Giving',
        responsibleName: 'Daniel Osei', responsibleRole: 'Legacy Giving Officer',
        annualTarget: 150000, actualValue: 96000,
        monthlyProgression: [58, 50, 46, 40, 36, 64], achievement: 64, status: 'below-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Institutional Grants Weight',
      weightPercentage: 42,
      highestContributionLabel: 'Sponsorships',
      lowestAchievementLabel: 'Corporate',
    },
    operationalInsights: [
      { id: 'funding-insight-1', title: 'Review Corporate Strategy', description: 'Performance 22% below target for 3 consecutive months.', tone: 'warning' },
      { id: 'funding-insight-2', title: 'Upscale Individual Sponsorships', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },

  // ==============================================================
  // MARKETING
  // ==============================================================
  Marketing: {
    summary: { averageAchievement: 88.5, totalParameters: 14, activeLeads: 9 },
    rows: [
      {
        id: 'marketing-param-1', code: 'PRM-1102', parameter: 'Website',
        responsibleName: 'Grace Kim', responsibleRole: 'Digital Marketing Lead',
        annualTarget: 22000, actualValue: 35869,
        monthlyProgression: [60, 78, 95, 120, 145, 163], achievement: 163, status: 'on-target',
      },
      {
        id: 'marketing-param-2', code: 'PRM-2102', parameter: 'Social Media',
        responsibleName: 'John Doe', responsibleRole: 'Social Media Manager',
        annualTarget: 220880, actualValue: 198792,
        monthlyProgression: [70, 74, 68, 80, 85, 90], achievement: 90, status: 'near-target',
      },
      {
        id: 'marketing-param-3', code: 'PRM-3102', parameter: 'PR',
        responsibleName: 'Sarah Jenkins', responsibleRole: 'PR Lead',
        annualTarget: 48, actualValue: 54,
        monthlyProgression: [72, 85, 92, 100, 108, 113], achievement: 113, status: 'on-target',
      },
      {
        id: 'marketing-param-4', code: 'PRM-4102', parameter: 'Newsletter',
        responsibleName: 'Michael Chen', responsibleRole: 'Content Lead',
        annualTarget: 36, actualValue: 21,
        monthlyProgression: [62, 55, 50, 44, 48, 58], achievement: 58, status: 'below-target',
      },
      {
        id: 'marketing-param-5', code: 'PRM-5102', parameter: 'Paid Advertising',
        responsibleName: 'Daniel Osei', responsibleRole: 'Performance Marketing Lead',
        annualTarget: 100000, actualValue: 89000,
        monthlyProgression: [50, 62, 71, 80, 85, 89], achievement: 89, status: 'near-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Website Traffic Weight',
      weightPercentage: 38,
      highestContributionLabel: 'Website',
      lowestAchievementLabel: 'Newsletter',
    },
    operationalInsights: [
      { id: 'marketing-insight-1', title: 'Revive Newsletter Engagement', description: 'Open rate 42% below target for 2 consecutive months.', tone: 'warning' },
      { id: 'marketing-insight-2', title: 'Scale Website Acquisition', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },

  // ==============================================================
  // MONITORING AND EVALUATION
  // ==============================================================
  'Monitoring and Evaluation': {
    summary: { averageAchievement: 82.1, totalParameters: 10, activeLeads: 6 },
    rows: [
      {
        id: 'me-param-1', code: 'PRM-1202', parameter: 'Survey Response Rate - Mentors',
        responsibleName: 'Fatima Ali', responsibleRole: 'M&E Officer',
        annualTarget: 22000, actualValue: 35869,
        monthlyProgression: [55, 70, 90, 120, 145, 163], achievement: 163, status: 'on-target',
      },
      {
        id: 'me-param-2', code: 'PRM-2202', parameter: 'Survey Response Rate - Talents',
        responsibleName: 'John Doe', responsibleRole: 'Data Analyst',
        annualTarget: 220880, actualValue: 231924,
        monthlyProgression: [72, 80, 68, 90, 95, 105], achievement: 105, status: 'near-target',
      },
      {
        id: 'me-param-3', code: 'PRM-3202', parameter: 'Data Quality Audits',
        responsibleName: 'Maria Garcia', responsibleRole: 'Quality Assurance Lead',
        annualTarget: 24, actualValue: 22,
        monthlyProgression: [70, 78, 82, 86, 90, 92], achievement: 92, status: 'on-target',
      },
      {
        id: 'me-param-4', code: 'PRM-4202', parameter: 'Field Verification Visits',
        responsibleName: 'Peter Nkurunziza', responsibleRole: 'Field Coordinator',
        annualTarget: 60, actualValue: 41,
        monthlyProgression: [64, 58, 52, 46, 50, 68], achievement: 68, status: 'below-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Survey Response Weight',
      weightPercentage: 35,
      highestContributionLabel: 'Mentors',
      lowestAchievementLabel: 'Field Visits',
    },
    operationalInsights: [
      { id: 'me-insight-1', title: 'Escalate Field Verification', description: 'Visits 32% below annual target with 6 months remaining.', tone: 'warning' },
      { id: 'me-insight-2', title: 'Sustain Mentor Response Rate', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },

  // ==============================================================
  // PROGRAM
  // ==============================================================
  Program: {
    summary: { averageAchievement: 89.2, totalParameters: 16, activeLeads: 10 },
    rows: [
      {
        id: 'program-param-1', code: 'PRM-1302', parameter: 'Campus',
        responsibleName: 'Mary Precious', responsibleRole: 'Campus Operations Lead',
        annualTarget: 365, actualValue: 343,
        monthlyProgression: [70, 78, 84, 88, 91, 94], achievement: 94, status: 'on-target',
      },
      {
        id: 'program-param-2', code: 'PRM-2302', parameter: 'Recruitment',
        responsibleName: 'Sarah Jenkins', responsibleRole: 'Recruitment Lead',
        annualTarget: 65, actualValue: 53,
        monthlyProgression: [60, 68, 72, 76, 79, 81], achievement: 81, status: 'near-target',
      },
      {
        id: 'program-param-3', code: 'PRM-3302', parameter: 'Talent Retention',
        responsibleName: 'Michael Chen', responsibleRole: 'Retention Lead',
        annualTarget: 900, actualValue: 828,
        monthlyProgression: [75, 80, 85, 88, 90, 92], achievement: 92, status: 'on-target',
      },
      {
        id: 'program-param-4', code: 'PRM-4302', parameter: 'Job Placement',
        responsibleName: 'Daniel Osei', responsibleRole: 'Placement Officer',
        annualTarget: 40, actualValue: 31,
        monthlyProgression: [82, 76, 70, 74, 78, 78], achievement: 78, status: 'below-target',
      },
      {
        id: 'program-param-5', code: 'PRM-5302', parameter: 'Visibility',
        responsibleName: 'Grace Kim', responsibleRole: 'Communications Lead',
        annualTarget: 320, actualValue: 285,
        monthlyProgression: [68, 74, 79, 83, 86, 89], achievement: 89, status: 'near-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Campus Operations Weight',
      weightPercentage: 40,
      highestContributionLabel: 'Campus',
      lowestAchievementLabel: 'Job Placement',
    },
    operationalInsights: [
      { id: 'program-insight-1', title: 'Address Job Placement Decline', description: 'Placement rate declined 8% this period.', tone: 'warning' },
      { id: 'program-insight-2', title: 'Maintain Campus Momentum', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },

  // ==============================================================
  // PARTNERSHIPS
  // ==============================================================
  Partnerships: {
    summary: { averageAchievement: 79.3, totalParameters: 11, activeLeads: 7 },
    rows: [
      {
        id: 'partnerships-param-1', code: 'PRM-1402', parameter: 'Invite-Only Donors',
        responsibleName: 'Maria Garcia', responsibleRole: 'Donor Relations Lead',
        annualTarget: 365, actualValue: 343,
        monthlyProgression: [72, 79, 85, 89, 92, 94], achievement: 94, status: 'on-target',
      },
      {
        id: 'partnerships-param-2', code: 'PRM-2402', parameter: 'Sponsorships',
        responsibleName: 'John Doe', responsibleRole: 'Sponsorship Manager',
        annualTarget: 900, actualValue: 729,
        monthlyProgression: [60, 68, 72, 76, 79, 81], achievement: 81, status: 'near-target',
      },
      {
        id: 'partnerships-param-3', code: 'PRM-3402', parameter: 'Corporate MOUs',
        responsibleName: 'Sarah Jenkins', responsibleRole: 'Corporate Relations Lead',
        annualTarget: 15, actualValue: 9,
        monthlyProgression: [58, 50, 46, 40, 44, 60], achievement: 60, status: 'below-target',
      },
      {
        id: 'partnerships-param-4', code: 'PRM-4402', parameter: 'Government Relations',
        responsibleName: 'Peter Nkurunziza', responsibleRole: 'Public Affairs Lead',
        annualTarget: 40, actualValue: 36,
        monthlyProgression: [75, 80, 84, 87, 89, 91], achievement: 91, status: 'on-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Invite-Only Donor Weight',
      weightPercentage: 36,
      highestContributionLabel: 'Invite-Only Donors',
      lowestAchievementLabel: 'Corporate MOUs',
    },
    operationalInsights: [
      { id: 'partnerships-insight-1', title: 'Accelerate Corporate MOU Pipeline', description: 'Signed MOUs 40% below annual target.', tone: 'warning' },
      { id: 'partnerships-insight-2', title: 'Sustain Government Relations', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },

  // ==============================================================
  // MENTORSHIP
  // ==============================================================
  Mentorship: {
    summary: { averageAchievement: 90.8, totalParameters: 8, activeLeads: 5 },
    rows: [
      {
        id: 'mentorship-param-1', code: 'PRM-1502', parameter: 'Mentors',
        responsibleName: 'Mary Precious', responsibleRole: 'Mentorship Program Lead',
        annualTarget: 40, actualValue: 29,
        monthlyProgression: [82, 76, 80, 74, 78, 77], achievement: 77, status: 'below-target',
      },
      {
        id: 'mentorship-param-2', code: 'PRM-2502', parameter: 'Session Attendance',
        responsibleName: 'Grace Kim', responsibleRole: 'Program Coordinator',
        annualTarget: 200, actualValue: 176,
        monthlyProgression: [70, 76, 81, 85, 87, 88], achievement: 88, status: 'near-target',
      },
      {
        id: 'mentorship-param-3', code: 'PRM-3502', parameter: 'Mentee Progress',
        responsibleName: 'Daniel Osei', responsibleRole: 'Mentee Success Lead',
        annualTarget: 92, actualValue: 84,
        monthlyProgression: [78, 82, 86, 88, 90, 91], achievement: 91, status: 'on-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Mentee Progress Weight',
      weightPercentage: 45,
      highestContributionLabel: 'Mentee Progress',
      lowestAchievementLabel: 'Mentors',
    },
    operationalInsights: [
      { id: 'mentorship-insight-1', title: 'Address Mentor Attrition', description: 'Active mentor count 28% below annual target.', tone: 'warning' },
      { id: 'mentorship-insight-2', title: 'Sustain Mentee Progress Trend', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },

  // ==============================================================
  // GUEST SPEAKERS
  // ==============================================================
  'Guest Speakers': {
    summary: { averageAchievement: 71.4, totalParameters: 6, activeLeads: 4 },
    rows: [
      {
        id: 'guest-speakers-param-1', code: 'PRM-1602', parameter: 'Sessions Delivered',
        responsibleName: 'Sarah Jenkins', responsibleRole: 'Speaker Programs Lead',
        annualTarget: 900, actualValue: 693,
        monthlyProgression: [82, 76, 80, 74, 78, 77], achievement: 77, status: 'below-target',
      },
      {
        id: 'guest-speakers-param-2', code: 'PRM-2602', parameter: 'Speaker Confirmations',
        responsibleName: 'Michael Chen', responsibleRole: 'Speaker Relations Coordinator',
        annualTarget: 60, actualValue: 39,
        monthlyProgression: [62, 55, 50, 58, 62, 65], achievement: 65, status: 'below-target',
      },
      {
        id: 'guest-speakers-param-3', code: 'PRM-3602', parameter: 'Attendee Satisfaction',
        responsibleName: 'Maria Garcia', responsibleRole: 'Events Officer',
        annualTarget: 90, actualValue: 79,
        monthlyProgression: [74, 78, 82, 85, 87, 88], achievement: 88, status: 'near-target',
      },
    ],
    achievementDistribution: {
      weightLabel: 'Attendee Satisfaction Weight',
      weightPercentage: 33,
      highestContributionLabel: 'Attendee Satisfaction',
      lowestAchievementLabel: 'Speaker Confirmations',
    },
    operationalInsights: [
      { id: 'guest-speakers-insight-1', title: 'Expand Speaker Pipeline', description: 'Confirmed speakers 35% below annual target.', tone: 'warning' },
      { id: 'guest-speakers-insight-2', title: 'Maintain Attendee Satisfaction', description: 'SUCCESS TREND', tone: 'success' },
    ],
  },
};