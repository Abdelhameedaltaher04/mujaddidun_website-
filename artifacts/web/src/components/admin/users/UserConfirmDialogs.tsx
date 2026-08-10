import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/contexts/LocaleContext';
import {
  ROLE_SLUGS,
  type AdminUser,
  type UserRoleSlug,
} from '@/services/adminUsers';

interface BaseConfirmProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isPending: boolean;
}

/** Suspend / activate confirmation. */
export function StatusConfirmDialog({
  user,
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: BaseConfirmProps & { onConfirm: () => void }) {
  const { t } = useLocale();
  if (!user) return null;
  const suspending = user.status === 'active';
  const name = `${user.first_name} ${user.last_name}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-confirm-status">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {suspending
              ? t('admin.users.suspendTitle')
              : t('admin.users.activateTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {suspending
              ? t('admin.users.suspendDescription', { name })
              : t('admin.users.activateDescription', { name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('admin.users.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className={
              suspending
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : undefined
            }
            data-testid="button-confirm-status"
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {suspending
              ? t('admin.users.actionDeactivate')
              : t('admin.users.actionActivate')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Role change confirmation with role picker. */
export function RoleConfirmDialog({
  user,
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: BaseConfirmProps & { onConfirm: (role: UserRoleSlug) => void }) {
  const { t } = useLocale();
  const [role, setRole] = useState<UserRoleSlug>('user');

  useEffect(() => {
    if (user && open) setRole(user.role.slug);
  }, [user, open]);

  if (!user) return null;
  const name = `${user.first_name} ${user.last_name}`;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-confirm-role">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.users.changeRoleTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.users.changeRoleDescription', { name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-1.5">
          <Label>{t('admin.users.columns.role')}</Label>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as UserRoleSlug)}
          >
            <SelectTrigger data-testid="select-new-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_SLUGS.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {t(`admin.users.roles.${slug}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('admin.users.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm(role);
            }}
            disabled={isPending || role === user.role.slug}
            data-testid="button-confirm-role"
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('admin.users.confirmChangeRole')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Delete confirmation. */
export function DeleteConfirmDialog({
  user,
  open,
  onOpenChange,
  isPending,
  onConfirm,
}: BaseConfirmProps & { onConfirm: () => void }) {
  const { t } = useLocale();
  if (!user) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent data-testid="dialog-confirm-delete">
        <AlertDialogHeader>
          <AlertDialogTitle>{t('admin.users.deleteTitle')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('admin.users.deleteDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            {t('admin.users.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            data-testid="button-confirm-delete"
          >
            {isPending ? (
              <Loader2 className="me-2 h-4 w-4 animate-spin" />
            ) : null}
            {t('admin.users.actionDelete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
