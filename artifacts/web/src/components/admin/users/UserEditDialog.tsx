import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  type UpdateUserInput,
  type UserRoleSlug,
  type UserStatus,
} from '@/services/adminUsers';

interface UserEditDialogProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: UpdateUserInput) => void;
  isSaving: boolean;
  /** Editing yourself locks role/status to avoid self-lockout. */
  isSelf: boolean;
}

/**
 * Edit user form: name, phone, role, status. Passwords are intentionally
 * not editable by admins.
 */
export function UserEditDialog({
  user,
  open,
  onOpenChange,
  onSubmit,
  isSaving,
  isSelf,
}: UserEditDialogProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<UpdateUserInput | null>(null);

  useEffect(() => {
    if (user && open) {
      setForm({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone,
        role: user.role.slug,
        status: user.status,
      });
    }
  }, [user, open]);

  if (!user || !form) return null;

  const valid = form.first_name.trim() !== '' && form.last_name.trim() !== '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="dialog-user-edit">
        <DialogHeader>
          <DialogTitle>{t('admin.users.editTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.users.editDescription')}
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (valid) onSubmit(form);
          }}
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="edit-first-name">
                {t('admin.users.firstName')}
              </Label>
              <Input
                id="edit-first-name"
                value={form.first_name}
                onChange={(event) =>
                  setForm({ ...form, first_name: event.target.value })
                }
                data-testid="input-edit-first-name"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-last-name">
                {t('admin.users.lastName')}
              </Label>
              <Input
                id="edit-last-name"
                value={form.last_name}
                onChange={(event) =>
                  setForm({ ...form, last_name: event.target.value })
                }
                data-testid="input-edit-last-name"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="edit-phone">{t('admin.users.columns.phone')}</Label>
            <Input
              id="edit-phone"
              dir="ltr"
              value={form.phone ?? ''}
              onChange={(event) =>
                setForm({ ...form, phone: event.target.value || null })
              }
              data-testid="input-edit-phone"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>{t('admin.users.columns.role')}</Label>
              <Select
                value={form.role}
                onValueChange={(role) =>
                  setForm({ ...form, role: role as UserRoleSlug })
                }
                disabled={isSelf}
              >
                <SelectTrigger data-testid="select-edit-role">
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
            <div className="space-y-1.5">
              <Label>{t('admin.users.columns.status')}</Label>
              <Select
                value={form.status}
                onValueChange={(status) =>
                  setForm({ ...form, status: status as UserStatus })
                }
                disabled={isSelf}
              >
                <SelectTrigger data-testid="select-edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">
                    {t('admin.users.statuses.active')}
                  </SelectItem>
                  <SelectItem value="suspended">
                    {t('admin.users.statuses.suspended')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t('admin.users.passwordNote')}
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t('admin.users.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!valid || isSaving}
              data-testid="button-save-user"
            >
              {isSaving ? (
                <Loader2 className="me-2 h-4 w-4 animate-spin" />
              ) : null}
              {t('admin.users.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
