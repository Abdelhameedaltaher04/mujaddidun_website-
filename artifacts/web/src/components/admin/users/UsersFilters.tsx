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
import { ROLE_SLUGS } from '@/services/adminUsers';

const ALL = 'all';

export interface UsersFiltersValue {
  search: string;
  role: string;
  status: string;
  verified: string;
  registeredFrom: string;
  registeredTo: string;
}

export const EMPTY_FILTERS: UsersFiltersValue = {
  search: '',
  role: ALL,
  status: ALL,
  verified: ALL,
  registeredFrom: '',
  registeredTo: '',
};

interface UsersFiltersProps {
  value: UsersFiltersValue;
  onChange: (value: UsersFiltersValue) => void;
}

/**
 * Search + filters toolbar. All controls combine; parent owns the state and
 * translates it into API query params.
 */
export function UsersFilters({ value, onChange }: UsersFiltersProps) {
  const { t } = useLocale();
  const set = (patch: Partial<UsersFiltersValue>) =>
    onChange({ ...value, ...patch });
  const isDirty = JSON.stringify(value) !== JSON.stringify(EMPTY_FILTERS);

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value.search}
          onChange={(event) => set({ search: event.target.value })}
          placeholder={t('admin.users.searchPlaceholder')}
          className="ps-9"
          data-testid="input-users-search"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.users.filterRole')}
          </Label>
          <Select value={value.role} onValueChange={(role) => set({ role })}>
            <SelectTrigger data-testid="select-filter-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('admin.users.allRoles')}</SelectItem>
              {ROLE_SLUGS.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {t(`admin.users.roles.${slug}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.users.filterStatus')}
          </Label>
          <Select
            value={value.status}
            onValueChange={(status) => set({ status })}
          >
            <SelectTrigger data-testid="select-filter-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>
                {t('admin.users.allStatuses')}
              </SelectItem>
              <SelectItem value="active">
                {t('admin.users.statuses.active')}
              </SelectItem>
              <SelectItem value="suspended">
                {t('admin.users.statuses.suspended')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.users.filterVerified')}
          </Label>
          <Select
            value={value.verified}
            onValueChange={(verified) => set({ verified })}
          >
            <SelectTrigger data-testid="select-filter-verified">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t('admin.users.allUsers')}</SelectItem>
              <SelectItem value="verified">
                {t('admin.users.verified')}
              </SelectItem>
              <SelectItem value="unverified">
                {t('admin.users.unverified')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.users.registeredFrom')}
          </Label>
          <Input
            type="date"
            value={value.registeredFrom}
            onChange={(event) => set({ registeredFrom: event.target.value })}
            data-testid="input-filter-date-from"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">
            {t('admin.users.registeredTo')}
          </Label>
          <Input
            type="date"
            value={value.registeredTo}
            onChange={(event) => set({ registeredTo: event.target.value })}
            data-testid="input-filter-date-to"
          />
        </div>
      </div>
      {isDirty ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onChange(EMPTY_FILTERS)}
          data-testid="button-clear-filters"
        >
          <X className="me-1 h-4 w-4" />
          {t('admin.users.clearFilters')}
        </Button>
      ) : null}
    </div>
  );
}
