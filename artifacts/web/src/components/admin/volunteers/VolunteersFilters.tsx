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
  APPLICATION_STATUSES,
  type VolunteerProgram,
} from '@/services/adminVolunteers';

export interface VolunteersFiltersValue {
  /** Matches applicant name, email, or phone. */
  search: string;
  status: string;
  program: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_VOLUNTEERS_FILTERS: VolunteersFiltersValue = {
  search: '',
  status: 'all',
  program: 'all',
  dateFrom: '',
  dateTo: '',
};

interface VolunteersFiltersProps {
  value: VolunteersFiltersValue;
  programs: VolunteerProgram[];
  onChange: (value: VolunteersFiltersValue) => void;
}

export function VolunteersFilters({
  value,
  programs,
  onChange,
}: VolunteersFiltersProps) {
  const { t, locale } = useLocale();
  const isDirty =
    value.search !== '' ||
    value.status !== 'all' ||
    value.program !== 'all' ||
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
              placeholder={t('admin.volunteers.searchPlaceholder')}
              className="ps-9"
              data-testid="input-volunteers-search"
            />
          </div>
          <Select
            value={value.status}
            onValueChange={(status) => onChange({ ...value, status })}
          >
            <SelectTrigger
              className="md:w-44"
              data-testid="select-volunteers-status"
            >
              <SelectValue placeholder={t('admin.volunteers.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('admin.volunteers.allStatuses')}
              </SelectItem>
              {APPLICATION_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`admin.volunteers.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={value.program}
            onValueChange={(program) => onChange({ ...value, program })}
          >
            <SelectTrigger
              className="md:w-56"
              data-testid="select-volunteers-program"
            >
              <SelectValue placeholder={t('admin.volunteers.filterProgram')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('admin.volunteers.allPrograms')}
              </SelectItem>
              {programs.map((program) => (
                <SelectItem key={program.id} value={String(program.id)}>
                  {locale === 'ar' ? program.title_ar : program.title_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="volunteers-date-from"
              className="text-xs text-muted-foreground"
            >
              {t('admin.volunteers.dateFrom')}
            </Label>
            <Input
              id="volunteers-date-from"
              type="date"
              value={value.dateFrom}
              max={value.dateTo || undefined}
              onChange={(event) =>
                onChange({ ...value, dateFrom: event.target.value })
              }
              data-testid="input-volunteers-date-from"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="volunteers-date-to"
              className="text-xs text-muted-foreground"
            >
              {t('admin.volunteers.dateTo')}
            </Label>
            <Input
              id="volunteers-date-to"
              type="date"
              value={value.dateTo}
              min={value.dateFrom || undefined}
              onChange={(event) =>
                onChange({ ...value, dateTo: event.target.value })
              }
              data-testid="input-volunteers-date-to"
            />
          </div>
          {isDirty ? (
            <Button
              variant="ghost"
              onClick={() => onChange(EMPTY_VOLUNTEERS_FILTERS)}
              data-testid="button-clear-volunteers-filters"
            >
              <X className="me-1.5 h-4 w-4" />
              {t('admin.volunteers.clearFilters')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
