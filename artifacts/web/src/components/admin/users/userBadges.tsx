import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import type { AdminUser, UserRoleSlug, UserStatus } from '@/services/adminUsers';

/** Shared presentational bits for the users management screens. */

const ROLE_STYLES: Record<UserRoleSlug, string> = {
  admin: 'bg-primary/10 text-primary border-primary/20',
  moderator: 'bg-secondary/10 text-secondary border-secondary/20',
  volunteer: 'bg-success/10 text-success border-success/20',
  user: 'bg-muted text-muted-foreground border-border',
};

export function RoleBadge({ role }: { role: UserRoleSlug }) {
  const { t } = useLocale();
  return (
    <Badge variant="outline" className={cn('font-medium', ROLE_STYLES[role])}>
      {t(`admin.users.roles.${role}`)}
    </Badge>
  );
}

export function StatusBadge({ status }: { status: UserStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        status === 'active'
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-destructive/10 text-destructive border-destructive/20',
      )}
    >
      {t(`admin.users.statuses.${status}`)}
    </Badge>
  );
}

export function VerifiedBadge({ verifiedAt }: { verifiedAt: string | null }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium',
        verifiedAt
          ? 'bg-success/10 text-success border-success/20'
          : 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
      )}
    >
      {verifiedAt ? t('admin.users.verified') : t('admin.users.unverified')}
    </Badge>
  );
}

export function UserAvatar({
  user,
  className,
}: {
  user: AdminUser;
  className?: string;
}) {
  const initials = `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`;
  return (
    <Avatar className={className}>
      {user.avatar_url ? (
        <AvatarImage
          src={user.avatar_url}
          alt={`${user.first_name} ${user.last_name}`}
        />
      ) : null}
      <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

/** Locale-aware date formatting for registration/activity columns. */
export function useUserDates() {
  const { locale, t } = useLocale();
  const intlLocale = locale === 'ar' ? 'ar-JO' : 'en-US';
  const dateFormatter = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
  });
  const dateTimeFormatter = new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return {
    formatDate: (iso: string | null) =>
      iso ? dateFormatter.format(new Date(iso)) : t('admin.users.never'),
    formatDateTime: (iso: string | null) =>
      iso ? dateTimeFormatter.format(new Date(iso)) : t('admin.users.never'),
  };
}
