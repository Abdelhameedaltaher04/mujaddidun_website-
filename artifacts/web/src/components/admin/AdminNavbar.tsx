import { useState } from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLocale } from '@/contexts/LocaleContext';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';
import { AdminNotifications } from './AdminNotifications';
import { AdminUserMenu } from './AdminUserMenu';
import { AdminSearchDialog } from './AdminSearchDialog';

/**
 * Sticky top navbar for the admin dashboard: sidebar toggle, breadcrumbs,
 * search, notifications, language switcher and the user menu.
 */
export function AdminNavbar() {
  const { t } = useLocale();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <SidebarTrigger
          aria-label={t('admin.toggleSidebar')}
          data-testid="button-admin-sidebar-toggle"
        />
        <Separator orientation="vertical" className="h-6" />
        <div className="hidden min-w-0 sm:block">
          <AdminBreadcrumbs />
        </div>

        <div className="ms-auto flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('common.search')}
            data-testid="button-admin-search"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" aria-hidden="true" />
          </Button>
          <AdminNotifications />
          <LanguageToggle />
          <Separator orientation="vertical" className="h-6" />
          <AdminUserMenu />
        </div>
      </header>

      <AdminSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
