import { useMemo, useState } from 'react';
import { useLocation } from 'wouter';
import { Newspaper, Plus, RefreshCw } from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AdminPagination } from '@/components/admin/AdminPagination';
import {
  EMPTY_NEWS_FILTERS,
  NewsFilters,
  type NewsFiltersValue,
} from '@/components/admin/news/NewsFilters';
import { NewsTable } from '@/components/admin/news/NewsTable';
import { NewsPreviewDialog } from '@/components/admin/news/NewsPreviewDialog';
import {
  ArchiveConfirmDialog,
  DeleteNewsConfirmDialog,
  PublishConfirmDialog,
} from '@/components/admin/news/NewsConfirmDialogs';
import {
  useAdminNewsList,
  useArchiveNews,
  useDeleteNews,
  useSetNewsPublished,
} from '@/hooks/useAdminNews';
import type {
  NewsArticle,
  NewsCategorySlug,
  NewsListParams,
  NewsStatus,
} from '@/services/adminNews';

type DialogKind = 'view' | 'publish' | 'archive' | 'delete' | null;

/**
 * Native date inputs emit transient values while typing the year
 * (e.g. 0002-08-10); only forward plausible, complete dates to the API.
 */
function completeDate(value: string): string | undefined {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '1900-01-01'
    ? value
    : undefined;
}

/** News management list: search/filter, paginate, preview, act. */
export default function AdminNewsPage() {
  const { t } = useLocale();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const [filters, setFilters] = useState<NewsFiltersValue>(EMPTY_NEWS_FILTERS);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<NewsArticle | null>(null);

  const params = useMemo<NewsListParams>(
    () => ({
      search: filters.search.trim() || undefined,
      category:
        filters.category !== 'all'
          ? (filters.category as NewsCategorySlug)
          : undefined,
      status:
        filters.status !== 'all' ? (filters.status as NewsStatus) : undefined,
      published_from: completeDate(filters.publishedFrom),
      published_to: completeDate(filters.publishedTo),
      page,
      per_page: perPage,
    }),
    [filters, page, perPage],
  );

  const list = useAdminNewsList(params);
  const setPublished = useSetNewsPublished();
  const archive = useArchiveNews();
  const remove = useDeleteNews();

  const openDialog =
    (kind: Exclude<DialogKind, null>) => (article: NewsArticle) => {
      setSelected(article);
      setDialog(kind);
    };
  const closeDialog = () => setDialog(null);

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.news.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const handleFiltersChange = (value: NewsFiltersValue) => {
    setFilters(value);
    setPage(1);
  };

  const articles = list.data?.data ?? [];
  const hasActiveFilters =
    JSON.stringify(filters) !== JSON.stringify(EMPTY_NEWS_FILTERS);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1
              className="text-2xl font-bold text-foreground sm:text-3xl"
              data-testid="text-news-title"
            >
              {t('admin.news.title')}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {t('admin.news.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/admin/news/new')}
            data-testid="button-add-news"
          >
            <Plus className="me-1.5 h-4 w-4" />
            {t('admin.news.addNews')}
          </Button>
        </div>

        <NewsFilters value={filters} onChange={handleFiltersChange} />

        {list.isPending ? (
          <div className="space-y-3" data-testid="news-loading">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full rounded-lg" />
            ))}
          </div>
        ) : list.isError ? (
          <Card data-testid="news-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(list.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => list.refetch()}
                data-testid="button-retry-news"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.news.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : articles.length === 0 ? (
          <Card data-testid="news-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Newspaper className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {hasActiveFilters
                  ? t('admin.news.noResults')
                  : t('admin.news.emptyState')}
              </p>
              {hasActiveFilters ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleFiltersChange(EMPTY_NEWS_FILTERS)}
                >
                  {t('admin.news.clearFilters')}
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/admin/news/new')}
                >
                  <Plus className="me-1.5 h-4 w-4" />
                  {t('admin.news.addNews')}
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
            <NewsTable
              articles={articles}
              onView={openDialog('view')}
              onEdit={(article) => navigate(`/admin/news/${article.id}/edit`)}
              onPublishToggle={openDialog('publish')}
              onArchive={openDialog('archive')}
              onDelete={openDialog('delete')}
            />
          </div>
        )}

        {list.data && articles.length > 0 ? (
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

      <NewsPreviewDialog
        article={selected}
        open={dialog === 'view'}
        onOpenChange={(open) => !open && closeDialog()}
      />
      <PublishConfirmDialog
        article={selected}
        open={dialog === 'publish'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={setPublished.isPending}
        onConfirm={() => {
          if (!selected) return;
          const publish = selected.status !== 'published';
          setPublished.mutate(
            { id: selected.id, publish },
            {
              onSuccess: () => {
                closeDialog();
                toast({
                  description: publish
                    ? t('admin.news.publishedSuccess')
                    : t('admin.news.unpublishedSuccess'),
                });
              },
              onError: notifyError,
            },
          );
        }}
      />
      <ArchiveConfirmDialog
        article={selected}
        open={dialog === 'archive'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={archive.isPending}
        onConfirm={() => {
          if (!selected) return;
          archive.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.news.archivedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
      <DeleteNewsConfirmDialog
        article={selected}
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={remove.isPending}
        onConfirm={() => {
          if (!selected) return;
          remove.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.news.deletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />
    </AdminLayout>
  );
}
