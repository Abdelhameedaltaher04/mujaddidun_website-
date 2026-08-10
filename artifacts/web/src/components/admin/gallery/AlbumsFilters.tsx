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
import { ALBUM_STATUSES } from '@/services/adminGallery';

const ALL = 'all';

export interface AlbumsFiltersValue {
  search: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_ALBUMS_FILTERS: AlbumsFiltersValue = {
  search: '',
  status: ALL,
  dateFrom: '',
  dateTo: '',
};

interface AlbumsFiltersProps {
  value: AlbumsFiltersValue;
  onChange: (value: AlbumsFiltersValue) => void;
}

/** Search + filters toolbar for the albums grid; parent owns the state. */
export function AlbumsFilters({ value, onChange }: AlbumsFiltersProps) {
  const { t } = useLocale();
  const set = (patch: Partial<AlbumsFiltersValue>) =>
    onChange({ ...value, ...patch });
  const isDirty =
    JSON.stringify(value) !== JSON.stringify(EMPTY_ALBUMS_FILTERS);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(event) => set({ search: event.target.value })}
          placeholder={t('admin.gallery.searchPlaceholder')}
          className="ps-9"
          data-testid="input-albums-search"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.gallery.filterStatus')}
          </Label>
          <Select
            value={value.status}
            onValueChange={(status) => set({ status })}
          >
            <SelectTrigger data-testid="select-albums-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('admin.gallery.allStatuses')}
              </SelectItem>
              {ALBUM_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`admin.gallery.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.gallery.dateFrom')}
          </Label>
          <Input
            type="date"
            value={value.dateFrom}
            onChange={(event) => set({ dateFrom: event.target.value })}
            data-testid="input-albums-date-from"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.gallery.dateTo')}
          </Label>
          <Input
            type="date"
            value={value.dateTo}
            onChange={(event) => set({ dateTo: event.target.value })}
            data-testid="input-albums-date-to"
          />
        </div>
      </div>
      {isDirty ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_ALBUMS_FILTERS)}
          data-testid="button-clear-album-filters"
        >
          <X className="me-1 h-4 w-4" />
          {t('admin.gallery.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
