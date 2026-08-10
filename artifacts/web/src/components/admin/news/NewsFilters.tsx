import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/contexts/LocaleContext';
import { NEWS_CATEGORIES } from '@/services/adminNews';

const ALL = 'all';

export interface NewsFiltersValue {
  search: string;
  category: string;
  status: string;
  publishedFrom: string;
  publishedTo: string;
}

export const EMPTY_NEWS_FILTERS: NewsFiltersValue = {
  search: '',
  category: ALL,
  status: ALL,
  publishedFrom: '',
  publishedTo: '',
};

interface NewsFiltersProps {
  value: NewsFiltersValue;
  onChange: (value: NewsFiltersValue) => void;
}

/** Search + filters toolbar for the news list; parent owns the state. */
export function NewsFilters({ value, onChange }: NewsFiltersProps) {
  const { t } = useLocale();
  const set = (patch: Partial<NewsFiltersValue>) =>
    onChange({ ...value, ...patch });
  const isDirty =
    JSON.stringify(value) !== JSON.stringify(EMPTY_NEWS_FILTERS);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(event) => set({ search: event.target.value })}
          placeholder={t('admin.news.searchPlaceholder')}
          className="ps-9"
          data-testid="input-news-search"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.news.filterCategory')}
          </Label>
          <Select
            value={value.category}
            onValueChange={(category) => set({ category })}
          >
            <SelectTrigger data-testid="select-news-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('admin.news.allCategories')}
              </SelectItem>
              {NEWS_CATEGORIES.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {t(`admin.news.categories.${slug}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.news.filterStatus')}
          </Label>
          <Select
            value={value.status}
            onValueChange={(status) => set({ status })}
          >
            <SelectTrigger data-testid="select-news-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('admin.news.allStatuses')}</SelectItem>
              <SelectItem value="draft">
                {t('admin.news.statuses.draft')}
              </SelectItem>
              <SelectItem value="published">
                {t('admin.news.statuses.published')}
              </SelectItem>
              <SelectItem value="archived">
                {t('admin.news.statuses.archived')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.news.publishedFrom')}
          </Label>
          <Input
            type="date"
            value={value.publishedFrom}
            onChange={(event) => set({ publishedFrom: event.target.value })}
            data-testid="input-news-date-from"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.news.publishedTo')}
          </Label>
          <Input
            type="date"
            value={value.publishedTo}
            onChange={(event) => set({ publishedTo: event.target.value })}
            data-testid="input-news-date-to"
          />
        </div>
      </div>
      {isDirty ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_NEWS_FILTERS)}
          data-testid="button-clear-news-filters"
        >
          <X className="me-1 h-4 w-4" />
          {t('admin.news.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
