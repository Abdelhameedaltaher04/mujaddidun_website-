import {
  Archive,
  Eye,
  ImageOff,
  MoreHorizontal,
  Pencil,
  Send,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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
import { cn } from '@/lib/utils';
import type { NewsArticle, NewsStatus } from '@/services/adminNews';

const STATUS_STYLES: Record<NewsStatus, string> = {
  draft: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400',
  published: 'bg-success/10 text-success border-success/20',
  archived: 'bg-muted text-muted-foreground border-border',
};

export function NewsStatusBadge({ status }: { status: NewsStatus }) {
  const { t } = useLocale();
  return (
    <Badge
      variant="outline"
      className={cn('font-medium', STATUS_STYLES[status])}
    >
      {t(`admin.news.statuses.${status}`)}
    </Badge>
  );
}

function Thumb({ article }: { article: NewsArticle }) {
  return article.featured_image_url ? (
    <img
      src={article.featured_image_url}
      alt=""
      className="h-12 w-16 shrink-0 rounded-md border border-border object-cover"
    />
  ) : (
    <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-muted">
      <ImageOff className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}

export interface NewsRowActions {
  onView: (article: NewsArticle) => void;
  onEdit: (article: NewsArticle) => void;
  onPublishToggle: (article: NewsArticle) => void;
  onArchive: (article: NewsArticle) => void;
  onDelete: (article: NewsArticle) => void;
}

function RowActionsMenu({
  article,
  actions,
}: {
  article: NewsArticle;
  actions: NewsRowActions;
}) {
  const { t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-news-actions-${article.id}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.news.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(article)}
          data-testid={`news-action-view-${article.id}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.news.actionView')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onEdit(article)}
          data-testid={`news-action-edit-${article.id}`}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t('admin.news.actionEdit')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onPublishToggle(article)}
          data-testid={`news-action-publish-${article.id}`}
        >
          {article.status === 'published' ? (
            <>
              <Undo2 className="me-2 h-4 w-4" />
              {t('admin.news.actionUnpublish')}
            </>
          ) : (
            <>
              <Send className="me-2 h-4 w-4" />
              {t('admin.news.actionPublish')}
            </>
          )}
        </DropdownMenuItem>
        {article.status !== 'archived' ? (
          <DropdownMenuItem
            onClick={() => actions.onArchive(article)}
            data-testid={`news-action-archive-${article.id}`}
          >
            <Archive className="me-2 h-4 w-4" />
            {t('admin.news.actionArchive')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(article)}
          className="text-destructive focus:text-destructive"
          data-testid={`news-action-delete-${article.id}`}
        >
          <Trash2 className="me-2 h-4 w-4" />
          {t('admin.news.actionDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface NewsTableProps extends NewsRowActions {
  articles: NewsArticle[];
}

/**
 * News list: table on md+ screens, stacked cards on mobile. Titles follow
 * the active locale, with the other language shown as secondary text.
 */
export function NewsTable({ articles, ...actions }: NewsTableProps) {
  const { t, locale } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { dateStyle: 'medium' },
  );
  const formatDate = (iso: string | null) =>
    iso ? dateFormatter.format(new Date(iso)) : '—';
  const primaryTitle = (a: NewsArticle) =>
    locale === 'ar' ? a.title_ar : a.title_en;
  const secondaryTitle = (a: NewsArticle) =>
    locale === 'ar' ? a.title_en : a.title_ar;

  return (
    <>
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.news.columns.article')}</TableHead>
              <TableHead>{t('admin.news.columns.category')}</TableHead>
              <TableHead>{t('admin.news.columns.author')}</TableHead>
              <TableHead>{t('admin.news.columns.status')}</TableHead>
              <TableHead>{t('admin.news.columns.publishedAt')}</TableHead>
              <TableHead>{t('admin.news.columns.updatedAt')}</TableHead>
              <TableHead className="w-12 text-end">
                {t('admin.news.columns.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow
                key={article.id}
                className="cursor-pointer"
                onClick={() => actions.onView(article)}
                data-testid={`row-news-${article.id}`}
              >
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Thumb article={article} />
                    <div className="min-w-0 max-w-xs">
                      <p className="truncate font-medium text-foreground">
                        {primaryTitle(article)}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {secondaryTitle(article)}
                      </p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {t(`admin.news.categories.${article.category}`)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {article.author}
                </TableCell>
                <TableCell>
                  <NewsStatusBadge status={article.status} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(article.published_at)}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(article.updated_at)}
                </TableCell>
                <TableCell
                  className="text-end"
                  onClick={(event) => event.stopPropagation()}
                >
                  <RowActionsMenu article={article} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {articles.map((article) => (
          <Card key={article.id} data-testid={`card-news-${article.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-start gap-3 text-start"
                  onClick={() => actions.onView(article)}
                >
                  <Thumb article={article} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 font-medium text-foreground">
                      {primaryTitle(article)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {t(`admin.news.categories.${article.category}`)} ·{' '}
                      {article.author}
                    </p>
                  </div>
                </button>
                <RowActionsMenu article={article} actions={actions} />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <NewsStatusBadge status={article.status} />
                <span className="ms-auto text-xs text-muted-foreground">
                  {formatDate(article.published_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
