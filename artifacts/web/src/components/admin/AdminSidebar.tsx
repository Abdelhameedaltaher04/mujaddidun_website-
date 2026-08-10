import { Link, useLocation } from 'wouter';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLocale } from '@/contexts/LocaleContext';
import { ADMIN_NAV_ITEMS, isNavItemActive } from './adminNav';
import logoUrl from '@/assets/mujaddidun-logo.png';

/**
 * Admin navigation sidebar. Collapsible to icons on desktop, becomes a
 * drawer (Sheet) on mobile automatically. Rendered on the correct side
 * for the active text direction.
 */
export function AdminSidebar() {
  const { t, dir } = useLocale();
  const [location] = useLocation();
  const { isMobile, setOpenMobile } = useSidebar();

  /** On mobile the drawer must close when a destination is chosen. */
  const closeMobileDrawer = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar
      side={dir === 'rtl' ? 'right' : 'left'}
      collapsible="icon"
      aria-label={t('admin.nav.label')}
    >
      <SidebarHeader>
        <Link
          href="/admin/dashboard"
          className="flex items-center gap-2 px-1 py-1.5"
          data-testid="link-admin-logo"
          onClick={closeMobileDrawer}
        >
          <img
            src={logoUrl}
            alt={t('app.name')}
            className="h-8 w-8 shrink-0 rounded-md object-contain"
          />
          <span className="truncate font-semibold text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            {t('admin.title')}
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t('admin.nav.label')}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {ADMIN_NAV_ITEMS.map((item) => {
                const label = t(`admin.nav.${item.key}`);
                return (
                  <SidebarMenuItem key={item.key}>
                    <SidebarMenuButton
                      asChild
                      isActive={isNavItemActive(item, location)}
                      tooltip={label}
                    >
                      <Link
                        href={item.href}
                        data-testid={`link-admin-nav-${item.key}`}
                        onClick={closeMobileDrawer}
                      >
                        <item.icon aria-hidden="true" />
                        <span>{label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
