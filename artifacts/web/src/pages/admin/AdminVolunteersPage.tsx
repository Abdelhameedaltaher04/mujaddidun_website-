import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { RefreshCw, Users } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import { VolunteersStats } from '@/components/admin/volunteers/VolunteersStats';
import {
  EMPTY_VOLUNTEERS_FILTERS,
  VolunteersFilters,
  type VolunteersFiltersValue,
} from '@/components/admin/volunteers/VolunteersFilters';
import { VolunteersTable } from '@/components/admin/volunteers/VolunteersTable';
import { RejectApplicationDialog } from '@/components/admin/volunteers/RejectApplicationDialog';
import {
  useAdminApplicationsList,
  useApplicationStatistics,
  useApplicationStatusAction,
  useVolunteerPrograms,
} from '@/hooks/useAdminVolunteers';
import type {
  ApplicationStatus,
  ApplicationsListParams,
  VolunteerApplication,
} from '@/services/adminVolunteers';

type DialogKind = 'review' | 'approve' | 'reject' | 'withdraw' | null;

/** Volunteer applications list: stats, combined filters, review actions. */
export default function AdminVolunteersPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState<VolunteersFiltersValue>(
    EMPTY_VOLUNTEERS_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<VolunteerApplication | null>(null);

  const params = useMemo<ApplicationsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      status:
        filters.status !== 'all'
          ? (filters.status as ApplicationStatus)
          : undefined,
      program_id:
        filters.program !== 'all' ? Number(filters.program) : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminApplicationsList(params);
  const stats = useApplicationStatistics();
  const programs = useVolunteerPrograms();
  const statusMutation = useApplicationStatusAction();

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.volunteers.genericError');

  const handleFiltersChange = (value: VolunteersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const closeDialog = () => setDialog(null);
  const openDialog =
    (kind: Exclude<DialogKind, null>) =>
    (application: VolunteerApplication) => {
      setSelected(application);
      setDialog(kind);
    };

  const runStatusChange = (
    status: ApplicationStatus,
    successKey: string,
    rejectionReason?: string,
  ) => {
    if (!selected) return;
    statusMutation.mutate(
      {
        id: selected.id,
        input: { status, rejection_reason: rejectionReason },
      },
      {
        onSuccess: () => {
          closeDialog();
          toast({ description: t(`admin.volunteers.${successKey}`) });
        },
        onError: (error) =>
          toast({ variant: 'destructive', description: errorMessage(error) }),
      },
    );
  };

  const applications = list.data?.data ?? [];
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.program !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-volunteers-title"
          >
            {t('admin.volunteers.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {t('admin.volunteers.subtitle')}
          </p>
        </div>

        <VolunteersStats stats={stats.data} isLoading={stats.isPending} />

        <VolunteersFilters
          value={filters}
          programs={programs.data ?? []}
          onChange={handleFiltersChange}
        />

        {list.isPending ? (
          <div className="space-y-3" data-testid="volunteers-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="volunteers-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-volunteers"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.volunteers.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : applications.length === 0 ? (
          <Card data-testid="volunteers-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.volunteers.noResults')
                  : t('admin.volunteers.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_VOLUNTEERS_FILTERS)}
                >
                  {t('admin.volunteers.clearFilters')}
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
            <VolunteersTable
              applications={applications}
              onView={(application) =>
                navigate(`/admin/volunteers/${application.id}`)
              }
              onMarkUnderReview={openDialog('review')}
              onApprove={openDialog('approve')}
              onReject={openDialog('reject')}
              onWithdraw={openDialog('withdraw')}
            />
          </div>
        )}

        {list.data && applications.length > 0 ? (
          <AdminPagination
            meta={list.data.meta}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value);
              setPage(1);
            }}
          />
        ) : null}
      </div>

      <GalleryConfirmDialog
        open={dialog === 'review'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.volunteers.reviewTitle')}
        description={t('admin.volunteers.reviewDescription')}
        actionLabel={t('admin.volunteers.actionMarkUnderReview')}
        testId="dialog-confirm-application-review"
        onConfirm={() => runStatusChange('under_review', 'reviewSuccess')}
      />

      <GalleryConfirmDialog
        open={dialog === 'approve'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.volunteers.approveTitle')}
        description={t('admin.volunteers.approveDescription')}
        actionLabel={t('admin.volunteers.actionApprove')}
        testId="dialog-confirm-application-approve"
        onConfirm={() => runStatusChange('approved', 'approveSuccess')}
      />

      <RejectApplicationDialog
        open={dialog === 'reject'}
        applicantName={selected?.full_name ?? ''}
        isPending={statusMutation.isPending}
        onOpenChange={(open) => !open && closeDialog()}
        onConfirm={(reason) =>
          runStatusChange('rejected', 'rejectSuccess', reason)
        }
      />

      <GalleryConfirmDialog
        open={dialog === 'withdraw'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.volunteers.withdrawTitle')}
        description={t('admin.volunteers.withdrawDescription')}
        actionLabel={t('admin.volunteers.actionWithdraw')}
        destructive
        testId="dialog-confirm-application-withdraw"
        onConfirm={() => runStatusChange('withdrawn', 'withdrawSuccess')}
      />
    </AdminLayout>
  );
}
