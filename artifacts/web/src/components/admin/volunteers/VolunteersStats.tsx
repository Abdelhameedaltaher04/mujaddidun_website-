import {
  CheckCircle2,
  ClipboardList,
  Clock,
  SearchCheck,
  XCircle,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import type { ApplicationStatistics } from '@/services/adminVolunteers';

interface VolunteersStatsProps {
  stats: ApplicationStatistics | undefined;
  isLoading: boolean;
}

function StatCard({
  icon: Icon,
  title,
  value,
  testId,
}: {
  icon: LucideIcon;
  title: string;
  value: string;
  testId: string;
}) {
  return (
    <Card
      className="transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
      data-testid={testId}
    >
      <CardContent className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-5 w-5 text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">{title}</p>
          <p className="mt-1 truncate text-2xl font-bold text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-12" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Summary cards fed by GET /volunteer-applications/statistics. */
export function VolunteersStats({ stats, isLoading }: VolunteersStatsProps) {
  const { t, locale } = useLocale();
  const formatCount = (count: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(count);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <StatCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard
        icon={ClipboardList}
        title={t('admin.volunteers.stats.total')}
        value={formatCount(stats.total)}
        testId="stat-applications-total"
      />
      <StatCard
        icon={Clock}
        title={t('admin.volunteers.stats.pending')}
        value={formatCount(stats.pending)}
        testId="stat-applications-pending"
      />
      <StatCard
        icon={SearchCheck}
        title={t('admin.volunteers.stats.underReview')}
        value={formatCount(stats.under_review)}
        testId="stat-applications-under-review"
      />
      <StatCard
        icon={CheckCircle2}
        title={t('admin.volunteers.stats.approved')}
        value={formatCount(stats.approved)}
        testId="stat-applications-approved"
      />
      <StatCard
        icon={XCircle}
        title={t('admin.volunteers.stats.rejected')}
        value={formatCount(stats.rejected)}
        testId="stat-applications-rejected"
      />
    </div>
  );
}
