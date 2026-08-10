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
import { PARTNER_TYPES } from '@/services/adminPartners';

export interface PartnersFiltersValue {
  search: string;
  type: string;
  status: string;
}

export const EMPTY_PARTNERS_FILTERS: PartnersFiltersValue = {
  search: '',
  type: 'all',
  status: 'all',
};

interface PartnersFiltersProps {
  value: PartnersFiltersValue;
  onChange: (value: PartnersFiltersValue) => void;
}

export function PartnersFilters({ value, onChange }: PartnersFiltersProps) {
  const { t } = useLocale();
  const isDirty =
    value.search !== '' || value.type !== 'all' || value.status !== 'all';

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
            placeholder={t('admin.partners.searchPlaceholder')}
            className="ps-9"
            data-testid="input-partners-search"
          />
        </div>
        <Select
          value={value.type}
          onValueChange={(type) => onChange({ ...value, type })}
        >
          <SelectTrigger
            className="md:w-52"
            data-testid="select-partners-type"
          >
            <SelectValue placeholder={t('admin.partners.filterType')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('admin.partners.allTypes')}
            </SelectItem>
            {PARTNER_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {t(`admin.partners.types.${type}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={value.status}
          onValueChange={(status) => onChange({ ...value, status })}
        >
          <SelectTrigger
            className="md:w-44"
            data-testid="select-partners-status"
          >
            <SelectValue placeholder={t('admin.partners.filterStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('admin.partners.allStatuses')}
            </SelectItem>
            <SelectItem value="active">
              {t('admin.partners.statuses.active')}
            </SelectItem>
            <SelectItem value="inactive">
              {t('admin.partners.statuses.inactive')}
            </SelectItem>
          </SelectContent>
        </Select>
        {isDirty ? (
          <Button
            variant="ghost"
            onClick={() => onChange(EMPTY_PARTNERS_FILTERS)}
            data-testid="button-clear-partners-filters"
          >
            <X className="me-1.5 h-4 w-4" />
            {t('admin.partners.clearFilters')}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
