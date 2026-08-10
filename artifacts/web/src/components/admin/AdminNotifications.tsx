import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Notifications bell. Placeholder for now — shows an empty state until
 * real notifications are wired to the backend in a later phase.
 */
export function AdminNotifications() {
  const { t } = useLocale();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('admin.notifications.label')}
          data-testid="button-admin-notifications"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="text-sm font-semibold text-foreground">
          {t('admin.notifications.label')}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {t('admin.notifications.empty')}
        </p>
      </PopoverContent>
    </Popover>
  );
}
