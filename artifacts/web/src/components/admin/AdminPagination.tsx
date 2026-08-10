import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/contexts/LocaleContext';

const PER_PAGE_OPTIONS = [10, 25, 50];

export interface PaginationMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
  from: number | null;
  to: number | null;
}

interface AdminPaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

/**
 * Generic pagination footer for admin lists, driven by a Laravel-style
 * `meta` payload so it works unchanged with server-side pagination.
 */
export function AdminPagination({
  meta,
  onPageChange,
  onPerPageChange,
}: AdminPaginationProps) {
  const { t, dir } = useLocale();
  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p
        className="text-sm text-muted-foreground"
        data-testid="text-pagination-total"
      >
        {meta.total === 0
          ? t('admin.pagination.noResults')
          : t('admin.pagination.showingResults', {
              from: String(meta.from ?? 0),
              to: String(meta.to ?? 0),
              total: String(meta.total),
            })}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {t('admin.pagination.perPage')}
          </span>
          <Select
            value={String(meta.per_page)}
            onValueChange={(value) => onPerPageChange(Number(value))}
          >
            <SelectTrigger
              className="h-9 w-[4.5rem]"
              data-testid="select-pagination-per-page"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={meta.current_page <= 1}
            onClick={() => onPageChange(meta.current_page - 1)}
            data-testid="button-pagination-prev"
          >
            <PrevIcon className="h-4 w-4" />
            <span className="sr-only">{t('admin.pagination.previous')}</span>
          </Button>
          <span
            className="min-w-16 px-2 text-center text-sm text-muted-foreground"
            data-testid="text-pagination-page"
          >
            {t('admin.pagination.pageOf', {
              page: String(meta.current_page),
              pages: String(meta.last_page),
            })}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            disabled={meta.current_page >= meta.last_page}
            onClick={() => onPageChange(meta.current_page + 1)}
            data-testid="button-pagination-next"
          >
            <NextIcon className="h-4 w-4" />
            <span className="sr-only">{t('admin.pagination.next')}</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
