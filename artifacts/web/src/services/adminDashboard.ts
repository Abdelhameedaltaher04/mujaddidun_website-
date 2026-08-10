/**
 * Admin dashboard data service.
 *
 * Each function mirrors a future Laravel endpoint (noted alongside) and
 * already returns typed payloads, so switching from mock data to the real
 * API only means replacing the mock import with `apiClient` calls —
 * no component changes required.
 */
import {
  mockActivities,
  mockChartData,
  mockStats,
} from './mocks/adminDashboardMock';

export type StatKey =
  | 'users'
  | 'news'
  | 'events'
  | 'volunteerApplications'
  | 'donations'
  | 'contactMessages';

export interface DashboardStat {
  key: StatKey;
  /** Current total. Donations are in JOD. */
  value: number;
  /** Percentage change vs. the previous period (negative = down). */
  trend: number;
}

export type ActivityType =
  | 'user_registered'
  | 'news_published'
  | 'event_created'
  | 'volunteer_applied'
  | 'donation_received';

export type ActivityStatus = 'pending' | 'approved' | 'completed';

export interface ActivityItem {
  id: number;
  type: ActivityType;
  /** ISO timestamp. */
  occurred_at: string;
  status?: ActivityStatus;
}

export interface TimeSeriesPoint {
  /** ISO date (first day of period). */
  date: string;
  value: number;
}

export interface DashboardChartData {
  usersGrowth: TimeSeriesPoint[];
  donations: TimeSeriesPoint[];
  activity: {
    events: TimeSeriesPoint[];
    volunteers: TimeSeriesPoint[];
  };
}

const MOCK_DELAY_MS = 250;

function mockResponse<T>(data: T): Promise<T> {
  return new Promise((resolve) =>
    setTimeout(() => resolve(data), MOCK_DELAY_MS),
  );
}

export const adminDashboardApi = {
  /** Future endpoint: GET /admin/dashboard/stats */
  async getStats(): Promise<DashboardStat[]> {
    return mockResponse(mockStats);
  },

  /** Future endpoint: GET /admin/dashboard/charts */
  async getChartData(): Promise<DashboardChartData> {
    return mockResponse(mockChartData);
  },

  /** Future endpoint: GET /admin/dashboard/activities */
  async getRecentActivities(): Promise<ActivityItem[]> {
    return mockResponse(mockActivities);
  },
};
