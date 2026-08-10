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
import {
  PROGRAM_CATEGORIES,
  PROGRAM_STATUSES,
} from '@/services/adminPrograms';

const ALL = 'all';

export interface ProgramsFiltersValue {
  search: string;
  category: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_PROGRAMS_FILTERS: ProgramsFiltersValue = {
  search: '',
  category: ALL,
  status: ALL,
  dateFrom: '',
  dateTo: '',
};

interface ProgramsFiltersProps {
  value: ProgramsFiltersValue;
  onChange: (value: ProgramsFiltersValue) => void;
}

/** Search + filters toolbar for the programs list; parent owns the state. */
export function ProgramsFilters({ value, onChange }: ProgramsFiltersProps) {
  const { t } = useLocale();
  const set = (patch: Partial<ProgramsFiltersValue>) =>
    onChange({ ...value, ...patch });
  const isDirty =
    JSON.stringify(value) !== JSON.stringify(EMPTY_PROGRAMS_FILTERS);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(event) => set({ search: event.target.value })}
          placeholder={t('admin.programs.searchPlaceholder')}
          className="ps-9"
          data-testid="input-programs-search"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.programs.filterCategory')}
          </Label>
          <Select
            value={value.category}
            onValueChange={(category) => set({ category })}
          >
            <SelectTrigger data-testid="select-programs-category">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('admin.programs.allCategories')}
              </SelectItem>
              {PROGRAM_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {t(`admin.programs.categories.${category}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.programs.filterStatus')}
          </Label>
          <Select
            value={value.status}
            onValueChange={(status) => set({ status })}
          >
            <SelectTrigger data-testid="select-programs-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('admin.programs.allStatuses')}
              </SelectItem>
              {PROGRAM_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`admin.programs.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.programs.dateFrom')}
          </Label>
          <Input
            type="date"
            value={value.dateFrom}
            onChange={(event) => set({ dateFrom: event.target.value })}
            data-testid="input-programs-date-from"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.programs.dateTo')}
          </Label>
          <Input
            type="date"
            value={value.dateTo}
            onChange={(event) => set({ dateTo: event.target.value })}
            data-testid="input-programs-date-to"
          />
        </div>
      </div>
      {isDirty ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_PROGRAMS_FILTERS)}
          data-testid="button-clear-programs-filters"
        >
          <X className="me-1 h-4 w-4" />
          {t('admin.programs.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
