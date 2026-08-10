import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminUser } from '@/services/adminUsers';
import {
  RoleBadge,
  StatusBadge,
  UserAvatar,
  VerifiedBadge,
  useUserDates,
} from './userBadges';

interface UserDetailsDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({
  label,
  value,
  ltr,
}: {
  label: string;
  value: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className="text-sm font-medium text-foreground"
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </span>
    </div>
  );
}

/** Read-only user profile dialog. */
export function UserDetailsDialog({
  user,
  open,
  onOpenChange,
}: UserDetailsDialogProps) {
  const { t, locale } = useLocale();
  const { formatDate, formatDateTime } = useUserDates();

  if (!user) return null;

  const countryName = user.country_code
    ? new Intl.DisplayNames([locale === 'ar' ? 'ar' : 'en'], {
        type: 'region',
      }).of(user.country_code) ?? user.country_code
    : '—';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-md"
        data-testid="dialog-user-details"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.users.detailsTitle')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('admin.users.detailsTitle')}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <UserAvatar user={user} className="h-20 w-20 text-xl" />
          <div>
            <p
              className="text-lg font-semibold text-foreground"
              data-testid="text-details-name"
            >
              {user.first_name} {user.last_name}
            </p>
            <p className="text-sm text-muted-foreground" dir="ltr">
              {user.email}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <RoleBadge role={user.role.slug} />
            <StatusBadge status={user.status} />
            <VerifiedBadge verifiedAt={user.email_verified_at} />
          </div>
        </div>
        <Separator />
        <div className="divide-y divide-border">
          <DetailRow
            label={t('admin.users.columns.phone')}
            value={user.phone ?? '—'}
            ltr
          />
          <DetailRow label={t('admin.users.country')} value={countryName} />
          <DetailRow
            label={t('admin.users.emailVerifiedAt')}
            value={
              user.email_verified_at
                ? formatDate(user.email_verified_at)
                : t('admin.users.unverified')
            }
          />
          <DetailRow
            label={t('admin.users.columns.registered')}
            value={formatDate(user.created_at)}
          />
          <DetailRow
            label={t('admin.users.lastActivity')}
            value={formatDateTime(user.last_activity_at)}
          />
          <DetailRow
            label={t('admin.users.userId')}
            value={`#${user.id}`}
            ltr
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
