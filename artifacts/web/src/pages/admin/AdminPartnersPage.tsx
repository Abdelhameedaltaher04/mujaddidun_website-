import { useMemo, useState } from 'react';
import { ArrowUpDown, Handshake, Plus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  EMPTY_PARTNERS_FILTERS,
  PartnersFilters,
  type PartnersFiltersValue,
} from '@/components/admin/partners/PartnersFilters';
import { PartnersTable } from '@/components/admin/partners/PartnersTable';
import {
  PartnerFormDialog,
  type PartnerFormErrors,
} from '@/components/admin/partners/PartnerFormDialog';
import { PartnerPreviewDialog } from '@/components/admin/partners/PartnerPreviewDialog';
import { ReorderPartnersDialog } from '@/components/admin/partners/ReorderPartnersDialog';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import {
  useAdminPartnersList,
  useCreatePartner,
  useDeletePartner,
  usePartnerStatusAction,
  useReorderPartners,
  useUpdatePartner,
} from '@/hooks/useAdminPartners';
import type {
  Partner,
  PartnerInput,
  PartnerStatus,
  PartnerType,
  PartnersListParams,
} from '@/services/adminPartners';

type DialogKind =
  | 'form'
  | 'preview'
  | 'reorder'
  | 'activate'
  | 'deactivate'
  | 'delete'
  | null;

/** Partners list: filters, pagination, CRUD, status toggles, reorder. */
export default function AdminPartnersPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  const [filters, setFilters] = useState<PartnersFiltersValue>(
    EMPTY_PARTNERS_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<Partner | null>(null);
  const [serverErrors, setServerErrors] = useState<PartnerFormErrors>({});

  const params = useMemo<PartnersListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      type: filters.type !== 'all' ? (filters.type as PartnerType) : undefined,
      status:
        filters.status !== 'all'
          ? (filters.status as PartnerStatus)
          : undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminPartnersList(params);
  /** Full unfiltered list for drag & drop reordering. */
  const allPartners = useAdminPartnersList({ page: 1, per_page: 500 });
  const create = useCreatePartner();
  const update = useUpdatePartner();
  const statusMutation = usePartnerStatusAction();
  const reorder = useReorderPartners();
  const remove = useDeletePartner();

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.partners.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: PartnersFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const closeDialog = () => setDialog(null);
  const openDialog =
    (kind: Exclude<DialogKind, null | 'reorder'>) => (partner: Partner) => {
      setSelected(partner);
      if (kind === 'form') setServerErrors({});
      setDialog(kind);
    };
  const openCreate = () => {
    setSelected(null);
    setServerErrors({});
    setDialog('form');
  };

  const submitPartner = (input: PartnerInput) => {
    setServerErrors({});
    const onError = (error: unknown) => {
      const { message, fields } = getApiError(error);
      setServerErrors(fields);
      toast({
        variant: 'destructive',
        description: message || t('admin.partners.genericError'),
      });
    };
    const onSuccess = () => {
      closeDialog();
      toast({
        description: selected
          ? t('admin.partners.updatedSuccess')
          : t('admin.partners.createdSuccess'),
      });
    };
    if (selected) {
      update.mutate({ id: selected.id, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
  };

  const runStatusAction = (action: 'activate' | 'deactivate') => {
    if (!selected) return;
    statusMutation.mutate(
      {
        id: selected.id,
        status: action === 'activate' ? 'active' : 'inactive',
      },
      {
        onSuccess: () => {
          closeDialog();
          toast({ description: t(`admin.partners.${action}Success`) });
        },
        onError: notifyError,
      },
    );
  };

  const partners = list.data?.data ?? [];
  const hasActiveFilters =
    filters.search !== '' || filters.type !== 'all' || filters.status !== 'all';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-foreground sm:text-3xl"
              data-testid="text-partners-title"
            >
              {t('admin.partners.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.partners.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setDialog('reorder')}
              disabled={!allPartners.data || allPartners.data.data.length < 2}
              data-testid="button-reorder-partners"
            >
              <ArrowUpDown className="me-1.5 h-4 w-4" />
              {t('admin.partners.reorder')}
            </Button>
            <Button onClick={openCreate} data-testid="button-add-partner">
              <Plus className="me-1.5 h-4 w-4" />
              {t('admin.partners.addPartner')}
            </Button>
          </div>
        </div>

        <PartnersFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="partners-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="partners-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-partners"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.partners.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : partners.length === 0 ? (
          <Card data-testid="partners-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Handshake className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.partners.noResults')
                  : t('admin.partners.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_PARTNERS_FILTERS)}
                >
                  {t('admin.partners.clearFilters')}
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('admin.partners.addPartner')}
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div
            className={
              list.isFetching ? 'pointer-events-none opacity-60' : undefined
            }
          >
            <PartnersTable
              partners={partners}
              onView={openDialog('preview')}
              onEdit={openDialog('form')}
              onActivate={openDialog('activate')}
              onDeactivate={openDialog('deactivate')}
              onDelete={openDialog('delete')}
            />
          </div>
        )}

        {list.data && partners.length > 0 ? (
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

      <PartnerFormDialog
        partner={selected}
        open={dialog === 'form'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={create.isPending || update.isPending}
        serverErrors={serverErrors}
        onSubmit={submitPartner}
      />

      <PartnerPreviewDialog
        partner={selected}
        open={dialog === 'preview'}
        onOpenChange={(open) => !open && closeDialog()}
      />

      <ReorderPartnersDialog
        partners={allPartners.data?.data ?? []}
        open={dialog === 'reorder'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={reorder.isPending}
        onSave={(ids) =>
          reorder.mutate(ids, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.partners.reorderSuccess') });
            },
            onError: notifyError,
          })
        }
      />

      <GalleryConfirmDialog
        open={dialog === 'activate'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.partners.activateTitle')}
        description={t('admin.partners.activateDescription')}
        actionLabel={t('admin.partners.actionActivate')}
        testId="dialog-confirm-partner-activate"
        onConfirm={() => runStatusAction('activate')}
      />

      <GalleryConfirmDialog
        open={dialog === 'deactivate'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.partners.deactivateTitle')}
        description={t('admin.partners.deactivateDescription')}
        actionLabel={t('admin.partners.actionDeactivate')}
        destructive
        testId="dialog-confirm-partner-deactivate"
        onConfirm={() => runStatusAction('deactivate')}
      />

      <GalleryConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={remove.isPending}
        title={t('admin.partners.deleteTitle')}
        description={t('admin.partners.deleteDescription')}
        actionLabel={t('admin.partners.actionDelete')}
        destructive
        testId="dialog-confirm-partner-delete"
        onConfirm={() => {
          if (!selected) return;
          remove.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.partners.deletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
