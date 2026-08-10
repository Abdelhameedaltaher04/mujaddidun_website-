import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/contexts/LocaleContext';
import {
  DONATION_METHODS,
  DONATION_STATUSES,
} from '@/services/adminDonations';

export interface DonationsFiltersValue {
  /** Matches donor name, email, or transaction id. */
  search: string;
  status: string;
  method: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_DONATIONS_FILTERS: DonationsFiltersValue = {
  search: '',
  status: 'all',
  method: 'all',
  dateFrom: '',
  dateTo: '',
};

interface DonationsFiltersProps {
  value: DonationsFiltersValue;
  onChange: (value: DonationsFiltersValue) => void;
}

export function DonationsFilters({ value, onChange }: DonationsFiltersProps) {
  const { t } = useLocale();
  const isDirty =
    value.search !== '' ||
    value.status !== 'all' ||
    value.method !== 'all' ||
    value.dateFrom !== '' ||
    value.dateTo !== '';

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={value.search}
              onChange={(event) =>
                onChange({ ...value, search: event.target.value })
              }
              placeholder={t('admin.donations.searchPlaceholder')}
              className="ps-9"
              data-testid="input-donations-search"
            />
          </div>
          <Select
            value={value.status}
            onValueChange={(status) => onChange({ ...value, status })}
          >
            <SelectTrigger
              className="md:w-44"
              data-testid="select-donations-status"
            >
              <SelectValue placeholder={t('admin.donations.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('admin.donations.allStatuses')}
              </SelectItem>
              {DONATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`admin.donations.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={value.method}
            onValueChange={(method) => onChange({ ...value, method })}
          >
            <SelectTrigger
              className="md:w-48"
              data-testid="select-donations-method"
            >
              <SelectValue placeholder={t('admin.donations.filterMethod')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('admin.donations.allMethods')}
              </SelectItem>
              {DONATION_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {t(`admin.donations.methods.${method}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="donations-date-from"
              className="text-xs text-muted-foreground"
            >
              {t('admin.donations.dateFrom')}
            </Label>
            <Input
              id="donations-date-from"
              type="date"
              value={value.dateFrom}
              max={value.dateTo || undefined}
              onChange={(event) =>
                onChange({ ...value, dateFrom: event.target.value })
              }
              data-testid="input-donations-date-from"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="donations-date-to"
              className="text-xs text-muted-foreground"
            >
              {t('admin.donations.dateTo')}
            </Label>
            <Input
              id="donations-date-to"
              type="date"
              value={value.dateTo}
              min={value.dateFrom || undefined}
              onChange={(event) =>
                onChange({ ...value, dateTo: event.target.value })
              }
              data-testid="input-donations-date-to"
            />
          </div>
          {isDirty ? (
            <Button
              variant="ghost"
              onClick={() => onChange(EMPTY_DONATIONS_FILTERS)}
              data-testid="button-clear-donations-filters"
            >
              <X className="me-1.5 h-4 w-4" />
              {t('admin.donations.clearFilters')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
