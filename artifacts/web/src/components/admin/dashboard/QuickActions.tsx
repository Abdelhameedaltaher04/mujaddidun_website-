import { Link } from 'wouter';
import {
  CalendarPlus,
  ClipboardCheck,
  FilePlus2,
  FolderPlus,
  ImagePlus,
  type LucideIcon,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';

interface QuickAction {
  key: string;
  href: string;
  icon: LucideIcon;
}

/**
 * Quick action shortcuts. Targets point at the admin sections; the CRUD
 * pages themselves arrive in a later phase (placeholders render today).
 */
const QUICK_ACTIONS: QuickAction[] = [
  { key: 'addNews', href: '/admin/news', icon: FilePlus2 },
  { key: 'addEvent', href: '/admin/events', icon: CalendarPlus },
  { key: 'addProgram', href: '/admin/programs', icon: FolderPlus },
  { key: 'addImage', href: '/admin/gallery', icon: ImagePlus },
  {
    key: 'reviewVolunteers',
    href: '/admin/volunteer-applications',
    icon: ClipboardCheck,
  },
];

export function QuickActions() {
  const { t } = useLocale();

  return (
    <Card data-testid="card-quick-actions">
      <CardHeader>
        <CardTitle className="text-base">
          {t('admin.dashboard.quickActions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-2">
          {QUICK_ACTIONS.map((action) => (
            <Link
              key={action.key}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-primary/5"
              data-testid={`quick-action-${action.key}`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                <action.icon
                  className="h-4 w-4 text-primary"
                  aria-hidden="true"
                />
              </span>
              {t(`admin.quickActions.${action.key}`)}
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
