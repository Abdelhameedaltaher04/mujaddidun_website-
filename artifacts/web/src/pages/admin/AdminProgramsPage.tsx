import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { FolderKanban, Plus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  EMPTY_PROGRAMS_FILTERS,
  ProgramsFilters,
  type ProgramsFiltersValue,
} from '@/components/admin/programs/ProgramsFilters';
import { ProgramsTable } from '@/components/admin/programs/ProgramsTable';
import { ProgramPreviewDialog } from '@/components/admin/programs/ProgramPreviewDialog';
import {
  ProgramDeleteConfirmDialog,
  ProgramStatusConfirmDialog,
} from '@/components/admin/programs/ProgramsConfirmDialogs';
import {
  useAdminProgramsList,
  useDeleteProgram,
  useProgramStatusAction,
  type ProgramStatusAction,
} from '@/hooks/useAdminPrograms';
import type {
  AdminProgram,
  ProgramCategory,
  ProgramStatus,
  ProgramsListParams,
} from '@/services/adminPrograms';

type DialogKind = 'view' | 'status' | 'delete' | null;

/**
 * Native date inputs emit transient values while typing the year
 * (e.g. 0002-08-10); only forward plausible, complete dates to the API.
 */
function completeDate(value: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01'
    ? value
    : undefined;
}

/** Programs management list: search/filter, paginate, preview, act. */
export default function AdminProgramsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState<ProgramsFiltersValue>(
    EMPTY_PROGRAMS_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<AdminProgram | null>(null);
  const [statusAction, setStatusAction] =
    useState<ProgramStatusAction | null>(null);

  const params = useMemo<ProgramsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      category:
        filters.category !== 'all'
          ? (filters.category as ProgramCategory)
          : undefined,
      status:
        filters.status !== 'all'
          ? (filters.status as ProgramStatus)
          : undefined,
      date_from: completeDate(filters.dateFrom),
      date_to: completeDate(filters.dateTo),
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminProgramsList(params);
  const statusMutation = useProgramStatusAction();
  const remove = useDeleteProgram();

  const openView = (program: AdminProgram) => {
    setSelected(program);
    setDialog('view');
  };
  const openStatus =
    (action: ProgramStatusAction) => (program: AdminProgram) => {
      setSelected(program);
      setStatusAction(action);
      setDialog('status');
    };
  const openDelete = (program: AdminProgram) => {
    setSelected(program);
    setDialog('delete');
  };
  const closeDialog = () => setDialog(null);

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.programs.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: ProgramsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const programs = list.data?.data ?? [];
  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_PROGRAMS_FILTERS);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-foreground sm:text-3xl"
              data-testid="text-programs-title"
            >
              {t('admin.programs.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.programs.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/programs/new')}
            data-testid="button-add-program"
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('admin.programs.addProgram')}
          </Button>
        </div>

        <ProgramsFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="programs-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="programs-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-programs"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.programs.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : programs.length === 0 ? (
          <Card data-testid="programs-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FolderKanban className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.programs.noResults')
                  : t('admin.programs.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_PROGRAMS_FILTERS)}
                >
                  {t('admin.programs.clearFilters')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/programs/new')}
                >
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('admin.programs.addProgram')}
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
            <ProgramsTable
              programs={programs}
              onView={openView}
              onEdit={(program) =>
                navigate(`/admin/programs/${program.id}/edit`)
              }
              onParticipants={(program) =>
                navigate(`/admin/programs/${program.id}/participants`)
              }
              onActivate={openStatus('activate')}
              onDeactivate={openStatus('deactivate')}
              onArchive={openStatus('archive')}
              onDelete={openDelete}
            />
          </div>
        )}

        {list.data && programs.length > 0 ? (
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

      <ProgramPreviewDialog
        program={selected}
        open={dialog === 'view'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <ProgramStatusConfirmDialog
        program={selected}
        action={statusAction}
        open={dialog === 'status'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={statusMutation.isPending}
        onConfirm={() => {
          if (!selected || !statusAction) return;
          statusMutation.mutate(
            { id: selected.id, action: statusAction },
            {
              onSuccess: () => {
                closeDialog();
                toast({
                  description: t(`admin.programs.${statusAction}Success`),
                });
              },
              onError: notifyError,
            },
          );
        }}
      />
      <ProgramDeleteConfirmDialog
        program={selected}
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!selected) return;
          remove.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.programs.deletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
