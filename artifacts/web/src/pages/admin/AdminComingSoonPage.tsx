import { useLocation } from 'wouter';
import { Construction } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useLocale } from '@/contexts/LocaleContext';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { findActiveNavItem } from '@/components/admin/adminNav';

/**
 * Placeholder for admin sections whose management pages are not built
 * yet. Keeps sidebar navigation coherent during the layout-only phase.
 */
export default function AdminComingSoonPage() {
  const { t } = useLocale();
  const [location] = useLocation();
  const active = findActiveNavItem(location);
  const sectionLabel = active ? t(`admin.nav.${active.key}`) : '';

  return (
    <AdminLayout>
      <Card>
        <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center sm:py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/10">
            <Construction
              className="h-7 w-7 text-secondary"
              aria-hidden="true"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {sectionLabel}
          </h1>
          <p className="max-w-md text-muted-foreground">
            {t('admin.comingSoon')}
          </p>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
