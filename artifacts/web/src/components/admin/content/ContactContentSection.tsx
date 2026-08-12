import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { useSiteSettings } from '@/hooks/useAdminSettings';
import { ContactSettingsSection } from '@/components/admin/settings/ContactSettingsSection';
import { SocialSettingsSection } from '@/components/admin/settings/SocialSettingsSection';

interface Props {
  onDirtyChange: (dirty: boolean) => void;
}

/**
 * Contact tab reuses the existing contact + social settings sections
 * (backed by useSiteSettings) so contact details live in a single place.
 */
export function ContactContentSection({ onDirtyChange }: Props) {
  const { t } = useLocale();
  const settingsQuery = useSiteSettings();
  const settings = settingsQuery.data;

  if (settingsQuery.isPending) {
    return (
      <div className="space-y-4" data-testid="content-contact-loading">
        <Skeleton className="h-96 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (settingsQuery.isError || !settings) {
    return (
      <Card>
        <CardContent
          className="flex flex-col items-center gap-3 p-10 text-center"
          data-testid="content-contact-error"
        >
          <p className="text-sm text-destructive">
            {getApiError(settingsQuery.error).message ||
              t('admin.content.loadError')}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => settingsQuery.refetch()}
            data-testid="button-retry-content-contact"
          >
            <RefreshCw className="me-2 h-4 w-4" />
            {t('admin.content.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <ContactSettingsSection
        key={JSON.stringify(settings.contact)}
        settings={settings.contact}
        onDirtyChange={onDirtyChange}
      />
      <SocialSettingsSection
        key={JSON.stringify(settings.social)}
        settings={settings.social}
        onDirtyChange={onDirtyChange}
      />
    </div>
  );
}
