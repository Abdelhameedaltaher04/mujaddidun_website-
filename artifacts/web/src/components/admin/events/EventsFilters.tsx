import { MapPin, Search, X } from 'lucide-react';
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
import { EVENT_STATUSES } from '@/services/adminEvents';

const ALL = 'all';

export interface EventsFiltersValue {
  search: string;
  status: string;
  registrationStatus: string;
  dateFrom: string;
  dateTo: string;
  location: string;
}

export const EMPTY_EVENTS_FILTERS: EventsFiltersValue = {
  search: '',
  status: ALL,
  registrationStatus: ALL,
  dateFrom: '',
  dateTo: '',
  location: '',
};

interface EventsFiltersProps {
  value: EventsFiltersValue;
  onChange: (value: EventsFiltersValue) => void;
}

/** Search + filters toolbar for the events list; parent owns the state. */
export function EventsFilters({ value, onChange }: EventsFiltersProps) {
  const { t } = useLocale();
  const set = (patch: Partial<EventsFiltersValue>) =>
    onChange({ ...value, ...patch });
  const isDirty =
    JSON.stringify(value) !== JSON.stringify(EMPTY_EVENTS_FILTERS);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.search}
            onChange={(event) => set({ search: event.target.value })}
            placeholder={t('admin.events.searchPlaceholder')}
            className="ps-9"
            data-testid="input-events-search"
          />
        </div>
        <div className="relative">
          <MapPin className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={value.location}
            onChange={(event) => set({ location: event.target.value })}
            placeholder={t('admin.events.locationPlaceholder')}
            className="ps-9"
            data-testid="input-events-location"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.events.filterStatus')}
          </Label>
          <Select
            value={value.status}
            onValueChange={(status) => set({ status })}
          >
            <SelectTrigger data-testid="select-events-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('admin.events.allStatuses')}
              </SelectItem>
              {EVENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`admin.events.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.events.filterRegistration')}
          </Label>
          <Select
            value={value.registrationStatus}
            onValueChange={(registrationStatus) =>
              set({ registrationStatus })
            }
          >
            <SelectTrigger data-testid="select-events-registration">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('admin.events.all')}</SelectItem>
              <SelectItem value="open">
                {t('admin.events.registrationOpen')}
              </SelectItem>
              <SelectItem value="closed">
                {t('admin.events.registrationClosed')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.events.dateFrom')}
          </Label>
          <Input
            type="date"
            value={value.dateFrom}
            onChange={(event) => set({ dateFrom: event.target.value })}
            data-testid="input-events-date-from"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.events.dateTo')}
          </Label>
          <Input
            type="date"
            value={value.dateTo}
            onChange={(event) => set({ dateTo: event.target.value })}
            data-testid="input-events-date-to"
          />
        </div>
      </div>
      {isDirty ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_EVENTS_FILTERS)}
          data-testid="button-clear-events-filters"
        >
          <X className="me-1 h-4 w-4" />
          {t('admin.events.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
