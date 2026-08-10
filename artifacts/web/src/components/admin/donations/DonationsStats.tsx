import {
  CircleDollarSign,
  Clock,
  HandCoins,
  TrendingUp,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import type { DonationStatistics } from '@/services/adminDonations';

interface DonationsStatsProps {
  stats: DonationStatistics | undefined;
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
          <Skeleton className="h-7 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}

/** Header statistic cards fed by GET /donations/statistics. */
export function DonationsStats({ stats, isLoading }: DonationsStatsProps) {
  const { t, locale } = useLocale();

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en', {
      style: 'currency',
      currency: stats?.currency ?? 'SAR',
      maximumFractionDigits: 0,
    }).format(amount);
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
        icon={HandCoins}
        title={t('admin.donations.stats.total')}
        value={formatAmount(stats.total_amount)}
        testId="stat-donations-total"
      />
      <StatCard
        icon={CircleDollarSign}
        title={t('admin.donations.stats.completed')}
        value={formatAmount(stats.completed_amount)}
        testId="stat-donations-completed"
      />
      <StatCard
        icon={Clock}
        title={t('admin.donations.stats.pending')}
        value={formatCount(stats.pending_count)}
        testId="stat-donations-pending"
      />
      <StatCard
        icon={Users}
        title={t('admin.donations.stats.donors')}
        value={formatCount(stats.donors_count)}
        testId="stat-donations-donors"
      />
      <StatCard
        icon={TrendingUp}
        title={t('admin.donations.stats.thisMonth')}
        value={formatAmount(stats.this_month_amount)}
        testId="stat-donations-this-month"
      />
    </div>
  );
}
