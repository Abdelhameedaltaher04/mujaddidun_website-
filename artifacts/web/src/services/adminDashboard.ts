/**
 * Admin dashboard data service — real Laravel endpoints (admin only):
 *   GET /admin/dashboard/statistics
 *   GET /admin/dashboard/charts
 *   GET /admin/dashboard/activities
 */
import { apiClient, type ApiEnvelope } from './api';

export type StatKey =
  | 'users'
  | 'news'
  | 'events'
  | 'programs'
  | 'volunteerApplications'
  | 'donations'
  | 'contactMessages'
  | 'unreadMessages';

export interface DashboardStat {
  key: StatKey;
  /** Current total. */
  value: number;
  /** Percentage change vs. the previous 30-day period (negative = down). */
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

export const adminDashboardApi = {
  /** GET /admin/dashboard/statistics */
  async getStats(): Promise<DashboardStat[]> {
    const response = await apiClient.get<ApiEnvelope<DashboardStat[]>>(
      '/admin/dashboard/statistics',
    );
    return response.data.data;
  },

  /** GET /admin/dashboard/charts */
  async getChartData(): Promise<DashboardChartData> {
    const response = await apiClient.get<ApiEnvelope<DashboardChartData>>(
      '/admin/dashboard/charts',
    );
    return response.data.data;
  },

  /** GET /admin/dashboard/activities */
  async getRecentActivities(): Promise<ActivityItem[]> {
    const response = await apiClient.get<ApiEnvelope<ActivityItem[]>>(
      '/admin/dashboard/activities',
    );
    return response.data.data;
  },
};
