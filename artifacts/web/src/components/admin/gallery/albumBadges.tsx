import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { AlbumStatus } from '@/services/adminGallery';

const ALBUM_STATUS_STYLES: Record<AlbumStatus, string> = {
  draft:
    'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  published: 'bg-success/10 text-success border-success/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

export function AlbumStatusBadge({ status }: { status: AlbumStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', ALBUM_STATUS_STYLES[status])}
    >
      {t(`admin.gallery.statuses.${status}`)}
    </Badge>
  );
}
