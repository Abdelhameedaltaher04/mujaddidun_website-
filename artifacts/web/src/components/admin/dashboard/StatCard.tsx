import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';

interface StatCardProps {
  icon: LucideIcon;
  title: string;
  /** Preformatted display value (already localized). */
  value: string;
  /** Percentage change vs. the previous period (negative = down). */
  trend: number;
  testId: string;
}

/**
 * Single dashboard statistic card: icon, title, value and a trend
 * indicator, with a subtle lift on hover.
 */
export function StatCard({
  icon: Icon,
  title,
  value,
  trend,
  testId,
}: StatCardProps) {
  const { t } = useLocale();
  const isUp = trend >= 0;
  const TrendIcon = isUp ? TrendingUp : TrendingDown;

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
          <p className="mt-1 text-2xl font-bold text-foreground">{value}</p>
          <p
            className={cn(
              'mt-1 inline-flex items-center gap-1 text-xs font-medium',
              isUp ? 'text-success' : 'text-destructive',
            )}
          >
            <TrendIcon className="h-3.5 w-3.5" aria-hidden="true" />
            <span dir="ltr">{`${isUp ? '+' : ''}${trend}%`}</span>
            <span className="font-normal text-muted-foreground">
              {t('admin.dashboard.vsLastMonth')}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

/** Loading placeholder matching StatCard dimensions. */
export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="flex items-start gap-4 p-5">
        <Skeleton className="h-11 w-11 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-28" />
        </div>
      </CardContent>
    </Card>
  );
}
