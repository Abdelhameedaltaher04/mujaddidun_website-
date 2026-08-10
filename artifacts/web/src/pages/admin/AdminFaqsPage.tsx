import { useMemo, useState } from 'react';
import { ArrowUpDown, HelpCircle, Plus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  EMPTY_FAQS_FILTERS,
  FaqsFilters,
  type FaqsFiltersValue,
} from '@/components/admin/faqs/FaqsFilters';
import { FaqsTable } from '@/components/admin/faqs/FaqsTable';
import {
  FaqFormDialog,
  type FaqFormErrors,
} from '@/components/admin/faqs/FaqFormDialog';
import { FaqPreviewDialog } from '@/components/admin/faqs/FaqPreviewDialog';
import { ReorderFaqsDialog } from '@/components/admin/faqs/ReorderFaqsDialog';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import {
  useAdminFaqsList,
  useCreateFaq,
  useDeleteFaq,
  useFaqStatusAction,
  useReorderFaqs,
  useUpdateFaq,
} from '@/hooks/useAdminFaqs';
import type {
  Faq,
  FaqCategory,
  FaqInput,
  FaqStatus,
  FaqsListParams,
} from '@/services/adminFaqs';

type DialogKind =
  | 'form'
  | 'preview'
  | 'reorder'
  | 'publish'
  | 'unpublish'
  | 'archive'
  | 'delete'
  | null;

const STATUS_ACTION_TARGET: Record<
  'publish' | 'unpublish' | 'archive',
  FaqStatus
> = {
  publish: 'published',
  unpublish: 'draft',
  archive: 'archived',
};

/** FAQ list: filters, pagination, CRUD, status actions, reorder, preview. */
export default function AdminFaqsPage() {
  const { t } = useLocale();
  const { toast } = useToast();

  const [filters, setFilters] = useState<FaqsFiltersValue>(EMPTY_FAQS_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<Faq | null>(null);
  const [serverErrors, setServerErrors] = useState<FaqFormErrors>({});

  const params = useMemo<FaqsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      category:
        filters.category !== 'all'
          ? (filters.category as FaqCategory)
          : undefined,
      status:
        filters.status !== 'all' ? (filters.status as FaqStatus) : undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminFaqsList(params);
  /** Full unfiltered list for drag & drop reordering. */
  const allFaqs = useAdminFaqsList({ page: 1, per_page: 500 });
  const create = useCreateFaq();
  const update = useUpdateFaq();
  const statusMutation = useFaqStatusAction();
  const reorder = useReorderFaqs();
  const remove = useDeleteFaq();

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.faqs.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: FaqsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const closeDialog = () => setDialog(null);
  const openDialog =
    (kind: Exclude<DialogKind, null | 'reorder'>) => (faq: Faq) => {
      setSelected(faq);
      if (kind === 'form') setServerErrors({});
      setDialog(kind);
    };
  const openCreate = () => {
    setSelected(null);
    setServerErrors({});
    setDialog('form');
  };

  const submitFaq = (input: FaqInput) => {
    setServerErrors({});
    const onError = (error: unknown) => {
      const { message, fields } = getApiError(error);
      setServerErrors(fields);
      toast({
        variant: 'destructive',
        description: message || t('admin.faqs.genericError'),
      });
    };
    const onSuccess = () => {
      closeDialog();
      toast({
        description: selected
          ? t('admin.faqs.updatedSuccess')
          : input.status === 'published'
            ? t('admin.faqs.publishedSuccess')
            : t('admin.faqs.draftSuccess'),
      });
    };
    if (selected) {
      update.mutate({ id: selected.id, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
  };

  const runStatusAction = (action: 'publish' | 'unpublish' | 'archive') => {
    if (!selected) return;
    statusMutation.mutate(
      { id: selected.id, status: STATUS_ACTION_TARGET[action] },
      {
        onSuccess: () => {
          closeDialog();
          toast({ description: t(`admin.faqs.${action}Success`) });
        },
        onError: notifyError,
      },
    );
  };

  const faqs = list.data?.data ?? [];
  const hasActiveFilters =
    filters.search !== '' ||
    filters.category !== 'all' ||
    filters.status !== 'all';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-foreground sm:text-3xl"
              data-testid="text-faqs-title"
            >
              {t('admin.faqs.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.faqs.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setDialog('reorder')}
              disabled={!allFaqs.data || allFaqs.data.data.length < 2}
              data-testid="button-reorder-faqs"
            >
              <ArrowUpDown className="me-1.5 h-4 w-4" />
              {t('admin.faqs.reorder')}
            </Button>
            <Button onClick={openCreate} data-testid="button-add-faq">
              <Plus className="me-1.5 h-4 w-4" />
              {t('admin.faqs.addFaq')}
            </Button>
          </div>
        </div>

        <FaqsFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="faqs-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="faqs-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-faqs"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.faqs.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : faqs.length === 0 ? (
          <Card data-testid="faqs-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <HelpCircle className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.faqs.noResults')
                  : t('admin.faqs.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_FAQS_FILTERS)}
                >
                  {t('admin.faqs.clearFilters')}
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('admin.faqs.addFaq')}
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
            <FaqsTable
              faqs={faqs}
              onView={openDialog('preview')}
              onEdit={openDialog('form')}
              onPublish={openDialog('publish')}
              onUnpublish={openDialog('unpublish')}
              onArchive={openDialog('archive')}
              onDelete={openDialog('delete')}
            />
          </div>
        )}

        {list.data && faqs.length > 0 ? (
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

      <FaqFormDialog
        faq={selected}
        open={dialog === 'form'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={create.isPending || update.isPending}
        serverErrors={serverErrors}
        onSubmit={submitFaq}
      />

      <FaqPreviewDialog
        faq={selected}
        open={dialog === 'preview'}
        onOpenChange={(open) => !open && closeDialog()}
      />

      <ReorderFaqsDialog
        faqs={allFaqs.data?.data ?? []}
        open={dialog === 'reorder'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={reorder.isPending}
        onSave={(ids) =>
          reorder.mutate(ids, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.faqs.reorderSuccess') });
            },
            onError: notifyError,
          })
        }
      />

      <GalleryConfirmDialog
        open={dialog === 'publish'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.faqs.publishTitle')}
        description={t('admin.faqs.publishDescription')}
        actionLabel={t('admin.faqs.actionPublish')}
        testId="dialog-confirm-faq-publish"
        onConfirm={() => runStatusAction('publish')}
      />

      <GalleryConfirmDialog
        open={dialog === 'unpublish'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.faqs.unpublishTitle')}
        description={t('admin.faqs.unpublishDescription')}
        actionLabel={t('admin.faqs.actionUnpublish')}
        destructive
        testId="dialog-confirm-faq-unpublish"
        onConfirm={() => runStatusAction('unpublish')}
      />

      <GalleryConfirmDialog
        open={dialog === 'archive'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        title={t('admin.faqs.archiveTitle')}
        description={t('admin.faqs.archiveDescription')}
        actionLabel={t('admin.faqs.actionArchive')}
        destructive
        testId="dialog-confirm-faq-archive"
        onConfirm={() => runStatusAction('archive')}
      />

      <GalleryConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={remove.isPending}
        title={t('admin.faqs.deleteTitle')}
        description={t('admin.faqs.deleteDescription')}
        actionLabel={t('admin.faqs.actionDelete')}
        destructive
        testId="dialog-confirm-faq-delete"
        onConfirm={() => {
          if (!selected) return;
          remove.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.faqs.deletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
