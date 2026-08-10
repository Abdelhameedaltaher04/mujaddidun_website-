import {
  CalendarDays,
  ClipboardList,
  FolderKanban,
  HandCoins,
  Handshake,
  HelpCircle,
  Images,
  LayoutDashboard,
  Mail,
  Newspaper,
  Settings,
  Users,
  type LucideIcon,
} from 'lucide-react';

export interface AdminNavItem {
  /** i18n key under `admin.nav.*` */
  key: string;
  href: string;
  icon: LucideIcon;
  /** Match the route exactly (dashboard) instead of by prefix. */
  exact?: boolean;
}

/**
 * Single source of truth for admin navigation. The sidebar and the
 * breadcrumbs both derive from this list so labels never drift.
 */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { key: 'dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
  { key: 'users', href: '/admin/users', icon: Users },
  { key: 'news', href: '/admin/news', icon: Newspaper },
  { key: 'events', href: '/admin/events', icon: CalendarDays },
  { key: 'programs', href: '/admin/programs', icon: FolderKanban },
  { key: 'gallery', href: '/admin/gallery', icon: Images },
  { key: 'partners', href: '/admin/partners', icon: Handshake },
  { key: 'faqs', href: '/admin/faqs', icon: HelpCircle },
  { key: 'donations', href: '/admin/donations', icon: HandCoins },
  {
    key: 'volunteerApplications',
    href: '/admin/volunteer-applications',
    icon: ClipboardList,
  },
  { key: 'contactMessages', href: '/admin/contact-messages', icon: Mail },
  { key: 'settings', href: '/admin/settings', icon: Settings },
];

export function isNavItemActive(item: AdminNavItem, location: string): boolean {
  return item.exact
    ? location === item.href
    : location === item.href || location.startsWith(`${item.href}/`);
}

/** Find the nav item matching the current location (for breadcrumbs/title). */
export function findActiveNavItem(location: string): AdminNavItem | undefined {
  return ADMIN_NAV_ITEMS.find((item) => isNavItemActive(item, location));
}
