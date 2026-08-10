/**
 * Temporary mock data for the admin dashboard overview.
 * Removed once the Laravel dashboard endpoints exist — the shapes here
 * match the service types in `../adminDashboard.ts` exactly.
 */
import type {
  ActivityItem,
  DashboardChartData,
  DashboardStat,
} from '../adminDashboard';

export const mockStats: DashboardStat[] = [
  { key: 'users', value: 1248, trend: 12.4 },
  { key: 'news', value: 86, trend: 4.8 },
  { key: 'events', value: 32, trend: 9.1 },
  { key: 'volunteerApplications', value: 154, trend: 18.6 },
  { key: 'donations', value: 24350, trend: 7.3 },
  { key: 'contactMessages', value: 210, trend: -3.2 },
];

/** Twelve months ending August 2026. */
const MONTHS = [
  '2025-09-01',
  '2025-10-01',
  '2025-11-01',
  '2025-12-01',
  '2026-01-01',
  '2026-02-01',
  '2026-03-01',
  '2026-04-01',
  '2026-05-01',
  '2026-06-01',
  '2026-07-01',
  '2026-08-01',
];

function series(values: number[]) {
  return MONTHS.map((date, index) => ({ date, value: values[index] }));
}

export const mockChartData: DashboardChartData = {
  usersGrowth: series([42, 58, 65, 81, 96, 110, 134, 158, 171, 190, 214, 229]),
  donations: series([
    980, 1240, 1130, 1680, 1820, 1540, 2100, 2380, 2050, 2620, 2940, 3210,
  ]),
  activity: {
    events: series([2, 3, 2, 4, 3, 5, 4, 6, 5, 7, 6, 8]),
    volunteers: series([6, 9, 8, 12, 11, 15, 14, 19, 17, 22, 25, 28]),
  },
};

export const mockActivities: ActivityItem[] = [
  { id: 1, type: 'user_registered', occurred_at: '2026-08-09T22:40:00Z' },
  {
    id: 2,
    type: 'donation_received',
    occurred_at: '2026-08-09T19:15:00Z',
    status: 'completed',
  },
  {
    id: 3,
    type: 'volunteer_applied',
    occurred_at: '2026-08-09T14:05:00Z',
    status: 'pending',
  },
  { id: 4, type: 'news_published', occurred_at: '2026-08-08T16:30:00Z' },
  {
    id: 5,
    type: 'event_created',
    occurred_at: '2026-08-08T10:20:00Z',
    status: 'approved',
  },
  { id: 6, type: 'user_registered', occurred_at: '2026-08-07T08:45:00Z' },
];
