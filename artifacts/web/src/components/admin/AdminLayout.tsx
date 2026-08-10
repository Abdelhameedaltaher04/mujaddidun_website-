import type { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AdminSidebar } from './AdminSidebar';
import { AdminNavbar } from './AdminNavbar';
import { AdminBreadcrumbs } from './AdminBreadcrumbs';

/**
 * Reads the sidebar state cookie written by the sidebar primitive so the
 * collapsed/expanded choice survives page reloads. Defaults to expanded.
 */
function getStoredSidebarOpen(): boolean {
  const match = document.cookie.match(/(?:^|;\s*)sidebar_state=(true|false)/);
  return match ? match[1] === 'true' : true;
}

/**
 * Shared admin dashboard shell: sidebar + navbar + content container.
 * Every admin page renders inside this layout so the chrome is never
 * duplicated. Sidebar open/collapsed state persists via cookie.
 */
export function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider defaultOpen={getStoredSidebarOpen()}>
      <AdminSidebar />
      <SidebarInset>
        <AdminNavbar />
        <div className="px-4 pt-3 sm:hidden">
          <AdminBreadcrumbs />
        </div>
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}
