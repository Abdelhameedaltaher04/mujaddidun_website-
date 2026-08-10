import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Images, Plus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  AlbumsFilters,
  EMPTY_ALBUMS_FILTERS,
  type AlbumsFiltersValue,
} from '@/components/admin/gallery/AlbumsFilters';
import { AlbumsGrid } from '@/components/admin/gallery/AlbumsGrid';
import {
  AlbumFormDialog,
  type AlbumFormErrors,
} from '@/components/admin/gallery/AlbumFormDialog';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import {
  useAdminAlbumsList,
  useAlbumStatusAction,
  useCreateAlbum,
  useDeleteAlbum,
  useUpdateAlbum,
} from '@/hooks/useAdminGallery';
import type {
  AlbumInput,
  AlbumStatus,
  AlbumsListParams,
  GalleryAlbum,
} from '@/services/adminGallery';

type StatusAction = 'publish' | 'unpublish' | 'archive';
type DialogKind = 'form' | StatusAction | 'delete' | null;

/** Maps a UI action to the album status the API receives. */
const ACTION_STATUS: Record<StatusAction, AlbumStatus> = {
  publish: 'published',
  unpublish: 'draft',
  archive: 'archived',
};

/** Albums grid: search/filter, paginate, create/edit, status actions. */
export default function AdminGalleryPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState<AlbumsFiltersValue>(
    EMPTY_ALBUMS_FILTERS,
  );
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<GalleryAlbum | null>(null);
  const [serverErrors, setServerErrors] = useState<AlbumFormErrors>({});

  const params = useMemo<AlbumsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      status:
        filters.status !== 'all'
          ? (filters.status as AlbumStatus)
          : undefined,
      date_from: filters.dateFrom || undefined,
      date_to: filters.dateTo || undefined,
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminAlbumsList(params);
  const create = useCreateAlbum();
  const update = useUpdateAlbum();
  const statusMutation = useAlbumStatusAction();
  const remove = useDeleteAlbum();

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.gallery.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: AlbumsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const openCreate = () => {
    setSelected(null);
    setServerErrors({});
    setDialog('form');
  };
  const openEdit = (album: GalleryAlbum) => {
    setSelected(album);
    setServerErrors({});
    setDialog('form');
  };
  const openAction = (kind: StatusAction | 'delete') => (album: GalleryAlbum) => {
    setSelected(album);
    setDialog(kind);
  };
  const closeDialog = () => setDialog(null);

  const submitAlbum = (input: AlbumInput) => {
    setServerErrors({});
    const onError = (error: unknown) => {
      const { message, fields } = getApiError(error);
      setServerErrors(fields);
      toast({
        variant: 'destructive',
        description: message || t('admin.gallery.genericError'),
      });
    };
    const onSuccess = () => {
      closeDialog();
      toast({
        description:
          input.status === 'draft'
            ? t('admin.gallery.savedDraftSuccess')
            : t('admin.gallery.publishedSuccess'),
      });
    };
    if (selected) {
      update.mutate({ id: selected.id, input }, { onSuccess, onError });
    } else {
      create.mutate(input, { onSuccess, onError });
    }
  };

  const albums = list.data?.data ?? [];
  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_ALBUMS_FILTERS);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-foreground sm:text-3xl"
              data-testid="text-gallery-title"
            >
              {t('admin.gallery.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.gallery.subtitle')}
            </p>
          </div>
          <Button onClick={openCreate} data-testid="button-add-album">
            <Plus className="me-1.5 h-4 w-4" />
            {t('admin.gallery.addAlbum')}
          </Button>
        </div>

        <AlbumsFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            data-testid="albums-loading"
          >
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-64 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="albums-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-albums"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.gallery.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : albums.length === 0 ? (
          <Card data-testid="albums-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Images className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.gallery.noResults')
                  : t('admin.gallery.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_ALBUMS_FILTERS)}
                >
                  {t('admin.gallery.clearFilters')}
                </Button>
              ) : (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('admin.gallery.addAlbum')}
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
            <AlbumsGrid
              albums={albums}
              onView={(album) => navigate(`/admin/gallery/${album.id}`)}
              onEdit={openEdit}
              onPublish={openAction('publish')}
              onUnpublish={openAction('unpublish')}
              onArchive={openAction('archive')}
              onDelete={openAction('delete')}
            />
          </div>
        )}

        {list.data && albums.length > 0 ? (
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

      <AlbumFormDialog
        album={selected}
        open={dialog === 'form'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={create.isPending || update.isPending}
        serverErrors={serverErrors}
        onSubmit={submitAlbum}
      />

      {(['publish', 'unpublish', 'archive'] as const).map((action) => (
        <GalleryConfirmDialog
          key={action}
          open={dialog === action}
          onOpenChange={(open) => !open && closeDialog()}
          isPending={statusMutation.isPending}
          title={t(`admin.gallery.${action}Title`)}
          description={t(`admin.gallery.${action}Description`)}
          actionLabel={t(
            `admin.gallery.action${action.charAt(0).toUpperCase()}${action.slice(1)}`,
          )}
          destructive={action === 'archive'}
          testId={`dialog-confirm-album-${action}`}
          onConfirm={() => {
            if (!selected) return;
            statusMutation.mutate(
              { id: selected.id, status: ACTION_STATUS[action] },
              {
                onSuccess: () => {
                  closeDialog();
                  toast({
                    description: t(`admin.gallery.${action}Success`),
                  });
                },
                onError: notifyError,
              },
            );
          }}
        />
      ))}

      <GalleryConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={remove.isPending}
        title={t('admin.gallery.deleteTitle')}
        description={t('admin.gallery.deleteDescription')}
        actionLabel={t('admin.gallery.actionDelete')}
        destructive
        testId="dialog-confirm-album-delete"
        onConfirm={() => {
          if (!selected) return;
          remove.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.gallery.deletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
