import { Link, useLocation } from 'wouter';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useLocale } from '@/contexts/LocaleContext';
import { findActiveNavItem } from './adminNav';

/**
 * Breadcrumb trail for admin pages, derived from the shared nav config:
 * Dashboard → current section (when not on the dashboard itself).
 */
export function AdminBreadcrumbs() {
  const { t } = useLocale();
  const [location] = useLocation();
  const active = findActiveNavItem(location);
  const onDashboard = !active || active.key === 'dashboard';

  return (
    <Breadcrumb aria-label={t('breadcrumb.label')}>
      <BreadcrumbList>
        <BreadcrumbItem>
          {onDashboard ? (
            <BreadcrumbPage>{t('admin.nav.dashboard')}</BreadcrumbPage>
          ) : (
            <BreadcrumbLink asChild>
              <Link href="/admin" data-testid="link-breadcrumb-dashboard">
                {t('admin.nav.dashboard')}
              </Link>
            </BreadcrumbLink>
          )}
        </BreadcrumbItem>
        {!onDashboard && active && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{t(`admin.nav.${active.key}`)}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
