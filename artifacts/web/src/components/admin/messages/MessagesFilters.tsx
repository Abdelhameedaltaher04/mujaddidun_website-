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
import { MESSAGE_STATUSES } from '@/services/adminMessages';

export interface MessagesFiltersValue {
  /** Matches sender name, email, or subject. */
  search: string;
  /** 'all' | 'read' | 'unread' */
  read: string;
  status: string;
  dateFrom: string;
  dateTo: string;
}

export const EMPTY_MESSAGES_FILTERS: MessagesFiltersValue = {
  search: '',
  read: 'all',
  status: 'all',
  dateFrom: '',
  dateTo: '',
};

interface MessagesFiltersProps {
  value: MessagesFiltersValue;
  onChange: (value: MessagesFiltersValue) => void;
}

export function MessagesFilters({ value, onChange }: MessagesFiltersProps) {
  const { t } = useLocale();
  const isDirty =
    value.search !== '' ||
    value.read !== 'all' ||
    value.status !== 'all' ||
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
              placeholder={t('admin.messages.searchPlaceholder')}
              className="ps-9"
              data-testid="input-messages-search"
            />
          </div>
          <Select
            value={value.read}
            onValueChange={(read) => onChange({ ...value, read })}
          >
            <SelectTrigger
              className="md:w-40"
              data-testid="select-messages-read"
            >
              <SelectValue placeholder={t('admin.messages.filterRead')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('admin.messages.allRead')}</SelectItem>
              <SelectItem value="unread">
                {t('admin.messages.unreadOnly')}
              </SelectItem>
              <SelectItem value="read">
                {t('admin.messages.readOnly')}
              </SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={value.status}
            onValueChange={(status) => onChange({ ...value, status })}
          >
            <SelectTrigger
              className="md:w-44"
              data-testid="select-messages-status"
            >
              <SelectValue placeholder={t('admin.messages.filterStatus')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">
                {t('admin.messages.allStatuses')}
              </SelectItem>
              {MESSAGE_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`admin.messages.statuses.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-3 md:flex-row md:items-end">
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="messages-date-from"
              className="text-xs text-muted-foreground"
            >
              {t('admin.messages.dateFrom')}
            </Label>
            <Input
              id="messages-date-from"
              type="date"
              value={value.dateFrom}
              max={value.dateTo || undefined}
              onChange={(event) =>
                onChange({ ...value, dateFrom: event.target.value })
              }
              data-testid="input-messages-date-from"
            />
          </div>
          <div className="flex-1 space-y-1.5">
            <Label
              htmlFor="messages-date-to"
              className="text-xs text-muted-foreground"
            >
              {t('admin.messages.dateTo')}
            </Label>
            <Input
              id="messages-date-to"
              type="date"
              value={value.dateTo}
              min={value.dateFrom || undefined}
              onChange={(event) =>
                onChange({ ...value, dateTo: event.target.value })
              }
              data-testid="input-messages-date-to"
            />
          </div>
          {isDirty ? (
            <Button
              variant="ghost"
              onClick={() => onChange(EMPTY_MESSAGES_FILTERS)}
              data-testid="button-clear-messages-filters"
            >
              <X className="me-1.5 h-4 w-4" />
              {t('admin.messages.clearFilters')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
