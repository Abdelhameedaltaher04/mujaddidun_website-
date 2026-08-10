import {
  Archive,
  CheckCircle2,
  Eye,
  MoreHorizontal,
  Pencil,
  Trash2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocale } from '@/contexts/LocaleContext';
import type { Faq } from '@/services/adminFaqs';
import {
  FaqCategoryBadge,
  FaqStatusBadge,
} from '@/components/admin/faqs/faqBadges';

export interface FaqActions {
  onView: (faq: Faq) => void;
  onEdit: (faq: Faq) => void;
  onPublish: (faq: Faq) => void;
  onUnpublish: (faq: Faq) => void;
  onArchive: (faq: Faq) => void;
  onDelete: (faq: Faq) => void;
}

interface FaqsTableProps extends FaqActions {
  faqs: Faq[];
}

function ActionsMenu({
  faq,
  actions,
  idSuffix = '',
}: {
  faq: Faq;
  actions: FaqActions;
  idSuffix?: string;
}) {
  const { t } = useLocale();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          data-testid={`button-faq-actions-${faq.id}${idSuffix}`}
        >
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">{t('admin.faqs.actions')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => actions.onView(faq)}
          data-testid={`faq-action-view-${faq.id}${idSuffix}`}
        >
          <Eye className="me-2 h-4 w-4" />
          {t('admin.faqs.actionView')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => actions.onEdit(faq)}
          data-testid={`faq-action-edit-${faq.id}${idSuffix}`}
        >
          <Pencil className="me-2 h-4 w-4" />
          {t('admin.faqs.actionEdit')}
        </DropdownMenuItem>
        {faq.status !== 'published' ? (
          <DropdownMenuItem
            onClick={() => actions.onPublish(faq)}
            data-testid={`faq-action-publish-${faq.id}${idSuffix}`}
          >
            <CheckCircle2 className="me-2 h-4 w-4" />
            {t('admin.faqs.actionPublish')}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={() => actions.onUnpublish(faq)}
            data-testid={`faq-action-unpublish-${faq.id}${idSuffix}`}
          >
            <XCircle className="me-2 h-4 w-4" />
            {t('admin.faqs.actionUnpublish')}
          </DropdownMenuItem>
        )}
        {faq.status !== 'archived' ? (
          <DropdownMenuItem
            onClick={() => actions.onArchive(faq)}
            data-testid={`faq-action-archive-${faq.id}${idSuffix}`}
          >
            <Archive className="me-2 h-4 w-4" />
            {t('admin.faqs.actionArchive')}
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => actions.onDelete(faq)}
          className="text-destructive focus:text-destructive"
          data-testid={`faq-action-delete-${faq.id}${idSuffix}`}
        >
          <Trash2 className="me-2 h-4 w-4" />
          {t('admin.faqs.actionDelete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Desktop table (lg+) and mobile/tablet cards for FAQs. */
export function FaqsTable({ faqs, ...actions }: FaqsTableProps) {
  const { t, locale } = useLocale();
  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  const questionOf = (faq: Faq) =>
    locale === 'ar' ? faq.question_ar : faq.question_en;

  return (
    <>
      {/* Desktop */}
      <div className="hidden overflow-hidden rounded-lg border border-border lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin.faqs.columnQuestion')}</TableHead>
              <TableHead>{t('admin.faqs.columnCategory')}</TableHead>
              <TableHead className="text-center">
                {t('admin.faqs.columnOrder')}
              </TableHead>
              <TableHead>{t('admin.faqs.columnStatus')}</TableHead>
              <TableHead>{t('admin.faqs.columnCreated')}</TableHead>
              <TableHead>{t('admin.faqs.columnUpdated')}</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {faqs.map((faq) => (
              <TableRow key={faq.id} data-testid={`row-faq-${faq.id}`}>
                <TableCell className="max-w-[320px]">
                  <p className="truncate font-medium text-foreground">
                    {faq.question_ar}
                  </p>
                  <p
                    className="truncate text-sm text-muted-foreground"
                    dir="ltr"
                  >
                    {faq.question_en}
                  </p>
                </TableCell>
                <TableCell>
                  <FaqCategoryBadge category={faq.category} />
                </TableCell>
                <TableCell className="text-center font-medium">
                  {faq.display_order}
                </TableCell>
                <TableCell>
                  <FaqStatusBadge status={faq.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(faq.created_at)}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {formatDate(faq.updated_at)}
                </TableCell>
                <TableCell>
                  <ActionsMenu faq={faq} actions={actions} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile / tablet */}
      <div className="space-y-3 lg:hidden">
        {faqs.map((faq) => (
          <Card key={faq.id} data-testid={`card-faq-${faq.id}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium leading-snug text-foreground">
                    {questionOf(faq)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    <FaqCategoryBadge category={faq.category} />
                    <FaqStatusBadge status={faq.status} />
                  </div>
                </div>
                <ActionsMenu faq={faq} actions={actions} idSuffix="-mobile" />
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                <span>
                  {t('admin.faqs.orderLabel', {
                    order: String(faq.display_order),
                  })}
                </span>
                <span>{formatDate(faq.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
