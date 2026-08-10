import { useMemo, useState } from 'react';
import { HandCoins, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import { DonationsStats } from '@/components/admin/donations/DonationsStats';
import {
  DonationsFilters,
  EMPTY_DONATIONS_FILTERS,
  type DonationsFiltersValue,
} from '@/components/admin/donations/DonationsFilters';
import { DonationsTable } from '@/components/admin/donations/DonationsTable';
import { DonationDetailsDialog } from '@/components/admin/donations/DonationDetailsDialog';
import { DonationReceiptDialog } from '@/components/admin/donations/DonationReceiptDialog';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import {
  useAdminDonationsList,
  useCancelDonation,
  useDonationStatistics,
  useDonationStatusAction,
  useRefundDonation,
} from '@/hooks/useAdminDonations';
import type {
  Donation,
  DonationMethod,
  DonationStatus,
  DonationsListParams,
} from '@/services/adminDonations';

type DialogKind =
  | 'details'
  | 'receipt'
  | 'complete'
  | 'fail'
  | 'refund'
  | 'cancel'
  | null;

/**
 * Donations list: statistics, filters, pagination, details/receipt,
 * and admin-only status actions (moderators are read-only).
 */
export default function AdminDonationsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const { user } = useAuth();
  /** Only admins may change donation states; moderators just view. */
  const readOnly = user?.role?.slug !== 'admin';

  const [filters, setFilters] = useState<DonationsFiltersValue>(
    EMPTY_DONATIONS_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<Donation | null>(null);

  const params = useMemo<DonationsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      status:
        filters.status !== 'all'
          ? (filters.status as DonationStatus)
          : undefined,
      method:
        filters.method !== 'all'
          ? (filters.method as DonationMethod)
          : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminDonationsList(params);
  const stats = useDonationStatistics();
  const statusMutation = useDonationStatusAction();
  const refund = useRefundDonation();
  const cancel = useCancelDonation();

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.donations.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: DonationsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const closeDialog = () => setDialog(null);
  const openDialog =
    (kind: Exclude<DialogKind, null>) => (donation: Donation) => {
      setSelected(donation);
      setDialog(kind);
    };

  const runAction = (
    kind: 'complete' | 'fail' | 'refund' | 'cancel',
  ) => {
    if (!selected) return;
    const onSuccess = () => {
      closeDialog();
      toast({ description: t(`admin.donations.${kind}Success`) });
    };
    const options = { onSuccess, onError: notifyError };
    if (kind === 'complete') {
      statusMutation.mutate({ id: selected.id, status: 'completed' }, options);
    } else if (kind === 'fail') {
      statusMutation.mutate({ id: selected.id, status: 'failed' }, options);
    } else if (kind === 'refund') {
      refund.mutate(selected.id, options);
    } else {
      cancel.mutate(selected.id, options);
    }
  };

  const donations = list.data?.data ?? [];
  const hasActiveFilters =
    filters.search !== '' ||
    filters.status !== 'all' ||
    filters.method !== 'all' ||
    filters.dateFrom !== '' ||
    filters.dateTo !== '';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-donations-title"
          >
            {t('admin.donations.title')}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {readOnly
              ? t('admin.donations.subtitleReadOnly')
              : t('admin.donations.subtitle')}
          </p>
        </div>

        <DonationsStats stats={stats.data} isLoading={stats.isPending} />

        <DonationsFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="donations-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="donations-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-donations"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.donations.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : donations.length === 0 ? (
          <Card data-testid="donations-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <HandCoins className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.donations.noResults')
                  : t('admin.donations.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_DONATIONS_FILTERS)}
                >
                  {t('admin.donations.clearFilters')}
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
            <DonationsTable
              donations={donations}
              readOnly={readOnly}
              onView={openDialog('details')}
              onMarkCompleted={openDialog('complete')}
              onMarkFailed={openDialog('fail')}
              onRefund={openDialog('refund')}
              onCancel={openDialog('cancel')}
            />
          </div>
        )}

        {list.data && donations.length > 0 ? (
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

      <DonationDetailsDialog
        donation={selected}
        open={dialog === 'details'}
        onOpenChange={(open) => !open && closeDialog()}
        onShowReceipt={() => setDialog('receipt')}
      />

      <DonationReceiptDialog
        donation={selected}
        open={dialog === 'receipt'}
        onOpenChange={(open) => !open && closeDialog()}
      />

      <GalleryConfirmDialog
        open={dialog === 'complete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.donations.completeTitle')}
        description={t('admin.donations.completeDescription')}
        actionLabel={t('admin.donations.actionMarkCompleted')}
        testId="dialog-confirm-donation-complete"
        onConfirm={() => runAction('complete')}
      />

      <GalleryConfirmDialog
        open={dialog === 'fail'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.donations.failTitle')}
        description={t('admin.donations.failDescription')}
        actionLabel={t('admin.donations.actionMarkFailed')}
        destructive
        testId="dialog-confirm-donation-fail"
        onConfirm={() => runAction('fail')}
      />

      <GalleryConfirmDialog
        open={dialog === 'refund'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={refund.isPending}
        title={t('admin.donations.refundTitle')}
        description={t('admin.donations.refundDescription')}
        actionLabel={t('admin.donations.actionRefund')}
        destructive
        testId="dialog-confirm-donation-refund"
        onConfirm={() => runAction('refund')}
      />

      <GalleryConfirmDialog
        open={dialog === 'cancel'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={cancel.isPending}
        title={t('admin.donations.cancelTitle')}
        description={t('admin.donations.cancelDescription')}
        actionLabel={t('admin.donations.actionCancel')}
        destructive
        testId="dialog-confirm-donation-cancel"
        onConfirm={() => runAction('cancel')}
      />
    </AdminLayout>
  );
}
