import {
  CheckCircle2,
  Inbox,
  Loader,
  MailOpen,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import type { MessageStatistics } from '@/services/adminMessages';

interface MessagesStatsProps {
  stats: MessageStatistics | undefined;
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

/** Summary cards fed by GET /contact-messages/statistics. */
export function MessagesStats({ stats, isLoading }: MessagesStatsProps) {
  const { t, locale } = useLocale();
  const formatCount = (count: number) =>
    new Intl.NumberFormat(locale === 'ar' ? 'ar' : 'en').format(count);

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-start gap-4 p-5">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-7 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Inbox}
        title={t('admin.messages.stats.total')}
        value={formatCount(stats.total)}
        testId="stat-messages-total"
      />
      <StatCard
        icon={MailOpen}
        title={t('admin.messages.stats.unread')}
        value={formatCount(stats.unread)}
        testId="stat-messages-unread"
      />
      <StatCard
        icon={Loader}
        title={t('admin.messages.stats.inProgress')}
        value={formatCount(stats.in_progress)}
        testId="stat-messages-in-progress"
      />
      <StatCard
        icon={CheckCircle2}
        title={t('admin.messages.stats.resolved')}
        value={formatCount(stats.resolved)}
        testId="stat-messages-resolved"
      />
    </div>
  );
}
