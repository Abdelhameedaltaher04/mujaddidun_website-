import { useMemo } from 'react';
import {
  CalendarDays,
  ClipboardList,
  HandCoins,
  Mail,
  Newspaper,
  RefreshCw,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import {
  StatCard,
  StatCardSkeleton,
} from '@/components/admin/dashboard/StatCard';
import {
  TimeSeriesChart,
  TimeSeriesChartSkeleton,
} from '@/components/admin/dashboard/TimeSeriesChart';
import {
  RecentActivityList,
  RecentActivityListSkeleton,
} from '@/components/admin/dashboard/RecentActivityList';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import {
  useDashboardActivities,
  useDashboardCharts,
  useDashboardStats,
} from '@/hooks/useAdminDashboard';
import type { StatKey } from '@/services/adminDashboard';

const STAT_ICONS: Record<StatKey, LucideIcon> = {
  users: Users,
  news: Newspaper,
  events: CalendarDays,
  programs: ClipboardList,
  volunteerApplications: ClipboardList,
  donations: HandCoins,
  contactMessages: Mail,
  unreadMessages: Mail,
};

/** Admin dashboard overview: statistics, charts, activity, quick actions. */
export default function AdminDashboardPage() {
  const { t, locale } = useLocale();
  const stats = useDashboardStats();
  const charts = useDashboardCharts();
  const activities = useDashboardActivities();

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat(locale === 'ar' ? 'ar-JO' : 'en-US'),
    [locale],
  );
  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'ar' ? 'ar-JO' : 'en-US', {
        style: 'currency',
        currency: 'JOD',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const hasError = stats.isError || charts.isError || activities.isError;
  const retryFailed = () => {
    if (stats.isError) void stats.refetch();
    if (charts.isError) void charts.refetch();
    if (activities.isError) void activities.refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-dashboard-title"
          >
            {t('admin.dashboard.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin.dashboard.subtitle')}
          </p>
        </div>

        {hasError && (
          <Card data-testid="dashboard-error">
            <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-destructive">
                {t('admin.dashboard.loadError')}
              </p>
              <Button
                variant="outline"
                onClick={retryFailed}
                data-testid="button-retry-dashboard"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('common.retry')}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {stats.isPending
            ? Array.from({ length: 6 }).map((_, index) => (
                <StatCardSkeleton key={index} />
              ))
            : stats.data?.map((stat) => (
                <StatCard
                  key={stat.key}
                  icon={STAT_ICONS[stat.key]}
                  title={t(`admin.dashboard.stats.${stat.key}`)}
                  value={
                    stat.key === 'donations'
                      ? currencyFormatter.format(stat.value)
                      : numberFormatter.format(stat.value)
                  }
                  trend={stat.trend}
                  testId={`stat-card-${stat.key}`}
                />
              ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {charts.isPending ? (
            <>
              <TimeSeriesChartSkeleton />
              <TimeSeriesChartSkeleton />
            </>
          ) : charts.data ? (
            <>
              <TimeSeriesChart
                title={t('admin.dashboard.charts.usersGrowth')}
                description={t('admin.dashboard.charts.usersGrowthDesc')}
                series={[
                  {
                    id: 'users',
                    label: t('admin.dashboard.stats.users'),
                    data: charts.data.usersGrowth,
                  },
                ]}
                testId="chart-users-growth"
              />
              <TimeSeriesChart
                title={t('admin.dashboard.charts.donations')}
                description={t('admin.dashboard.charts.donationsDesc')}
                variant="bar"
                series={[
                  {
                    id: 'donations',
                    label: t('admin.dashboard.stats.donations'),
                    data: charts.data.donations,
                    color: 'hsl(var(--chart-2))',
                  },
                ]}
                valueFormatter={(value) => numberFormatter.format(value)}
                testId="chart-donations"
              />
            </>
          ) : null}
        </div>

        {/* Activity chart + recent activity + quick actions */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-4">
            {charts.isPending ? (
              <TimeSeriesChartSkeleton />
            ) : charts.data ? (
              <TimeSeriesChart
                title={t('admin.dashboard.charts.activity')}
                description={t('admin.dashboard.charts.activityDesc')}
                series={[
                  {
                    id: 'events',
                    label: t('admin.dashboard.stats.events'),
                    data: charts.data.activity.events,
                  },
                  {
                    id: 'volunteers',
                    label: t('admin.dashboard.stats.volunteerApplications'),
                    data: charts.data.activity.volunteers,
                    color: 'hsl(var(--chart-3))',
                  },
                ]}
                testId="chart-activity"
              />
            ) : null}
            {activities.isPending ? (
              <RecentActivityListSkeleton />
            ) : activities.data ? (
              <RecentActivityList activities={activities.data} />
            ) : null}
          </div>
          <QuickActions />
        </div>
      </div>
    </AdminLayout>
  );
}
