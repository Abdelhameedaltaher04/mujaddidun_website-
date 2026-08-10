import { useMemo } from 'react';
import {
  CalendarDays,
  ClipboardList,
  HandCoins,
  Newspaper,
  UserPlus,
  type LucideIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import type {
  ActivityItem,
  ActivityStatus,
  ActivityType,
} from '@/services/adminDashboard';

const ACTIVITY_ICONS: Record<ActivityType, LucideIcon> = {
  user_registered: UserPlus,
  news_published: Newspaper,
  event_created: CalendarDays,
  volunteer_applied: ClipboardList,
  donation_received: HandCoins,
};

const STATUS_VARIANTS: Record<
  ActivityStatus,
  'secondary' | 'default' | 'outline'
> = {
  pending: 'secondary',
  approved: 'default',
  completed: 'outline',
};

/** Locale-aware "x hours ago" formatting. */
function useRelativeTime(locale: string) {
  return useMemo(() => {
    const rtf = new Intl.RelativeTimeFormat(
      locale === 'ar' ? 'ar-JO' : 'en-US',
      { numeric: 'auto' },
    );
    return (iso: string) => {
      const diffMs = new Date(iso).getTime() - Date.now();
      const diffMinutes = Math.round(diffMs / 60_000);
      if (Math.abs(diffMinutes) < 60) return rtf.format(diffMinutes, 'minute');
      const diffHours = Math.round(diffMinutes / 60);
      if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
      return rtf.format(Math.round(diffHours / 24), 'day');
    };
  }, [locale]);
}

/**
 * "Recent activity" feed. Activity descriptions and statuses come from
 * i18n keyed by the activity type so the API payload stays language-neutral.
 */
export function RecentActivityList({
  activities,
}: {
  activities: ActivityItem[];
}) {
  const { t, locale } = useLocale();
  const formatRelative = useRelativeTime(locale);

  return (
    <Card data-testid="card-recent-activity">
      <CardHeader>
        <CardTitle className="text-base">
          {t('admin.dashboard.recentActivity')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-4">
          {activities.map((activity) => {
            const Icon = ACTIVITY_ICONS[activity.type];
            return (
              <li
                key={activity.id}
                className="flex items-start gap-3"
                data-testid={`activity-item-${activity.id}`}
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon
                    className="h-4 w-4 text-muted-foreground"
                    aria-hidden="true"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground">
                    {t(`admin.activity.${activity.type}`)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatRelative(activity.occurred_at)}
                  </p>
                </div>
                {activity.status ? (
                  <Badge variant={STATUS_VARIANTS[activity.status]}>
                    {t(`admin.activityStatus.${activity.status}`)}
                  </Badge>
                ) : null}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}

/** Loading placeholder for the activity feed. */
export function RecentActivityListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
