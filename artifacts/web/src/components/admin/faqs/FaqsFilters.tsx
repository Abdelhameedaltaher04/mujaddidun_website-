import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/contexts/LocaleContext';
import { FAQ_CATEGORIES, FAQ_STATUSES } from '@/services/adminFaqs';

export interface FaqsFiltersValue {
  search: string;
  category: string;
  status: string;
}

export const EMPTY_FAQS_FILTERS: FaqsFiltersValue = {
  search: '',
  category: 'all',
  status: 'all',
};

interface FaqsFiltersProps {
  value: FaqsFiltersValue;
  onChange: (value: FaqsFiltersValue) => void;
}

export function FaqsFilters({ value, onChange }: FaqsFiltersProps) {
  const { t } = useLocale();
  const isDirty =
    value.search !== '' || value.category !== 'all' || value.status !== 'all';

  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(event) =>
              onChange({ ...value, search: event.target.value })
            }
            placeholder={t('admin.faqs.searchPlaceholder')}
            className="ps-9"
            data-testid="input-faqs-search"
          />
        </div>
        <Select
          value={value.category}
          onValueChange={(category) => onChange({ ...value, category })}
        >
          <SelectTrigger className="md:w-52" data-testid="select-faqs-category">
            <SelectValue placeholder={t('admin.faqs.filterCategory')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.faqs.allCategories')}</SelectItem>
            {FAQ_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {t(`admin.faqs.categories.${category}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.status}
          onValueChange={(status) => onChange({ ...value, status })}
        >
          <SelectTrigger className="md:w-44" data-testid="select-faqs-status">
            <SelectValue placeholder={t('admin.faqs.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin.faqs.allStatuses')}</SelectItem>
            {FAQ_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {t(`admin.faqs.statuses.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isDirty ? (
          <Button
            variant="ghost"
            onClick={() => onChange(EMPTY_FAQS_FILTERS)}
            data-testid="button-clear-faqs-filters"
          >
            <X className="me-1.5 h-4 w-4" />
            {t('admin.faqs.clearFilters')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
