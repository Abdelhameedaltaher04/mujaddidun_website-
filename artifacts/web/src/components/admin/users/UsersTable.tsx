import {
  Eye,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/contexts/LocaleContext';
import type { AdminUser } from '@/services/adminUsers';
import {
  RoleBadge,
  StatusBadge,
  UserAvatar,
  VerifiedBadge,
  useUserDates,
} from './userBadges';

export interface UserRowActions {
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
  onChangeRole: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
}

interface UsersTableProps extends UserRowActions {
  users: AdminUser[];
  /** Id of the currently signed-in admin — self-destructive rows are limited. */
  currentUserId?: number;
}

function RowActionsMenu({
  user,
  actions,
  isSelf,
}: {
  user: AdminUser;
  actions: UserRowActions;
  isSelf: boolean;
}) {
  const { t } = useLocale();
  const isActive = user.status === 'active';
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-user-actions-${user.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.users.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(user)}
          data-testid={`action-view-${user.id}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.users.actionView')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onEdit(user)}
          data-testid={`action-edit-${user.id}`}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t('admin.users.actionEdit')}
        </DropdownMenuItem>
        {!isSelf ? (
          <>
            <DropdownMenuItem
              onClick={() => actions.onChangeRole(user)}
              data-testid={`action-role-${user.id}`}
            >
              <ShieldCheck className="me-2 h-4 w-4" />
              {t('admin.users.actionChangeRole')}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => actions.onToggleStatus(user)}
              data-testid={`action-status-${user.id}`}
            >
              {isActive ? (
                <UserX className="me-2 h-4 w-4" />
              ) : (
                <UserCheck className="me-2 h-4 w-4" />
              )}
              {isActive
                ? t('admin.users.actionDeactivate')
                : t('admin.users.actionActivate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => actions.onDelete(user)}
              className="text-destructive focus:text-destructive"
              data-testid={`action-delete-${user.id}`}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t('admin.users.actionDelete')}
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Users list. Renders a full table on md+ screens and stacked cards on
 * mobile; any horizontal overflow stays inside the table container.
 */
export function UsersTable({
  users,
  currentUserId,
  ...actions
}: UsersTableProps) {
  const { t } = useLocale();
  const { formatDate } = useUserDates();

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.users.columns.user')}</TableHead>
              <TableHead>{t('admin.users.columns.phone')}</TableHead>
              <TableHead>{t('admin.users.columns.role')}</TableHead>
              <TableHead>{t('admin.users.columns.verification')}</TableHead>
              <TableHead>{t('admin.users.columns.status')}</TableHead>
              <TableHead>{t('admin.users.columns.registered')}</TableHead>
              <TableHead className="w-12 text-end">
                {t('admin.users.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow
                key={user.id}
                className="cursor-pointer"
                onClick={() => actions.onView(user)}
                data-testid={`row-user-${user.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <UserAvatar user={user} className="h-9 w-9" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">
                        {user.first_name} {user.last_name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground" dir="ltr">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <span dir="ltr" className="text-sm text-muted-foreground">
                    {user.phone ?? '—'}
                  </span>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role.slug} />
                </TableCell>
                <TableCell>
                  <VerifiedBadge verifiedAt={user.email_verified_at} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(user.created_at)}
                </TableCell>
                <TableCell
                  className="text-end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <RowActionsMenu
                    user={user}
                    actions={actions}
                    isSelf={user.id === currentUserId}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {users.map((user) => (
          <Card key={user.id} data-testid={`card-user-${user.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-3 text-start"
                  onClick={() => actions.onView(user)}
                >
                  <UserAvatar user={user} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {user.email}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground" dir="ltr">
                      {user.phone ?? '—'}
                    </p>
                  </div>
                </button>
                <RowActionsMenu
                  user={user}
                  actions={actions}
                  isSelf={user.id === currentUserId}
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role.slug} />
                <StatusBadge status={user.status} />
                <VerifiedBadge verifiedAt={user.email_verified_at} />
                <span className="ms-auto text-xs text-muted-foreground">
                  {formatDate(user.created_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
