import { LayoutDashboard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useLocale } from '@/contexts/LocaleContext';
import { AdminLayout } from '@/components/admin/AdminLayout';

/**
 * Admin dashboard landing page. Temporary welcome section only —
 * statistics and management widgets arrive in later phases.
 */
export default function AdminDashboardPage() {
  const { t } = useLocale();
  const { user } = useAuth();

  return (
    <AdminLayout>
      <Card className="overflow-hidden">
        <CardContent className="flex flex-col items-center gap-4 px-6 py-14 text-center sm:py-20">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <LayoutDashboard
              className="h-7 w-7 text-primary"
              aria-hidden="true"
            />
          </div>
          <h1
            className="text-2xl font-bold text-foreground sm:text-3xl"
            data-testid="text-admin-welcome"
          >
            {t('admin.welcome.title')}
          </h1>
          <p className="max-w-md text-muted-foreground">
            {t('admin.welcome.subtitle')}
          </p>
          {user ? (
            <p className="text-sm text-muted-foreground">
              {t('admin.welcome.greeting', { name: user.first_name })}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
