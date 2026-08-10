import { useMemo, useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import {
  EMPTY_FILTERS,
  UsersFilters,
  type UsersFiltersValue,
} from '@/components/admin/users/UsersFilters';
import { UsersTable } from '@/components/admin/users/UsersTable';
import { UsersPagination } from '@/components/admin/users/UsersPagination';
import { UserDetailsDialog } from '@/components/admin/users/UserDetailsDialog';
import { UserEditDialog } from '@/components/admin/users/UserEditDialog';
import {
  DeleteConfirmDialog,
  RoleConfirmDialog,
  StatusConfirmDialog,
} from '@/components/admin/users/UserConfirmDialogs';
import {
  useAdminUsersList,
  useDeleteUser,
  useUpdateUser,
  useUpdateUserRole,
  useUpdateUserStatus,
} from '@/hooks/useAdminUsers';
import type {
  AdminUser,
  UpdateUserInput,
  UserRoleSlug,
  UsersListParams,
  UserStatus,
} from '@/services/adminUsers';

type DialogKind = 'view' | 'edit' | 'status' | 'role' | 'delete' | null;

/** Users management: list, search/filter, paginate, view, edit, act. */
export default function AdminUsersPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user: currentUser } = useAuth();

  const [filters, setFilters] = useState<UsersFiltersValue>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<AdminUser | null>(null);

  const params = useMemo<UsersListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      role: filters.role !== 'all' ? (filters.role as UserRoleSlug) : undefined,
      status:
        filters.status !== 'all' ? (filters.status as UserStatus) : undefined,
      verified:
        filters.verified !== 'all'
          ? (filters.verified as 'verified' | 'unverified')
          : undefined,
      registered_from: filters.registeredFrom || undefined,
      registered_to: filters.registeredTo || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminUsersList(params);
  const updateUser = useUpdateUser();
  const updateStatus = useUpdateUserStatus();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const openDialog = (kind: Exclude<DialogKind, null>) => (user: AdminUser) => {
    setSelected(user);
    setDialog(kind);
  };
  const closeDialog = () => setDialog(null);

  /** Prefer the specific API error message over a generic one. */
  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.users.genericError');

  const notifySuccess = (message: string) =>
    toast({ description: message });
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: UsersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const users = list.data?.data ?? [];
  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-users-title"
          >
            {t('admin.users.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin.users.subtitle')}
          </p>
        </div>

        <UsersFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="users-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="users-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-users"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.users.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : users.length === 0 ? (
          <Card data-testid="users-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.users.noResults')
                  : t('admin.users.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_FILTERS)}
                >
                  {t('admin.users.clearFilters')}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              list.isFetching ? 'pointer-events-none opacity-60' : undefined
            }
          >
            <UsersTable
              users={users}
              currentUserId={currentUser?.id}
              onView={openDialog('view')}
              onEdit={openDialog('edit')}
              onToggleStatus={openDialog('status')}
              onChangeRole={openDialog('role')}
              onDelete={openDialog('delete')}
            />
          </div>
        )}

        {list.data && users.length > 0 ? (
          <UsersPagination
            meta={list.data.meta}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
          />
        ) : null}
      </div>

      <UserDetailsDialog
        user={selected}
        open={dialog === 'view'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <UserEditDialog
        user={selected}
        open={dialog === 'edit'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={updateUser.isPending}
        isSelf={selected?.id === currentUser?.id}
        onSubmit={(input: UpdateUserInput) => {
          if (!selected) return;
          updateUser.mutate(
            { id: selected.id, input },
            {
              onSuccess: () => {
                closeDialog();
                notifySuccess(t('admin.users.savedSuccess'));
              },
              onError: notifyError,
            },
          );
        }}
      />
      <StatusConfirmDialog
        user={selected}
        open={dialog === 'status'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={updateStatus.isPending}
        onConfirm={() => {
          if (!selected) return;
          const status: UserStatus =
            selected.status === 'active' ? 'suspended' : 'active';
          updateStatus.mutate(
            { id: selected.id, status },
            {
              onSuccess: () => {
                closeDialog();
                notifySuccess(
                  status === 'suspended'
                    ? t('admin.users.suspendedSuccess')
                    : t('admin.users.activatedSuccess'),
                );
              },
              onError: notifyError,
            },
          );
        }}
      />
      <RoleConfirmDialog
        user={selected}
        open={dialog === 'role'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={updateRole.isPending}
        onConfirm={(role) => {
          if (!selected) return;
          updateRole.mutate(
            { id: selected.id, role },
            {
              onSuccess: () => {
                closeDialog();
                notifySuccess(t('admin.users.roleChangedSuccess'));
              },
              onError: notifyError,
            },
          );
        }}
      />
      <DeleteConfirmDialog
        user={selected}
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={deleteUser.isPending}
        onConfirm={() => {
          if (!selected) return;
          deleteUser.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              notifySuccess(t('admin.users.deletedSuccess'));
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
