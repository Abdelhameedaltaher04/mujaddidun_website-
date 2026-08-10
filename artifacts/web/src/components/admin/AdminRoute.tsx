import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useLocation } from 'wouter';
import type { ComponentType } from 'react';

/**
 * Guards admin-only routes on the client side.
 *
 * - Unauthenticated visitors are sent to Login with a redirect back.
 * - Authenticated non-admin users are sent to the 403 page.
 *
 * This is a UX guard only; the Laravel backend must independently
 * authorize every admin API request (role check server-side).
 */
export function AdminRoute({
  component: Component,
}: {
  component: ComponentType;
}) {
  const { isLoading, isAuthenticated, user } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <div
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  if (user?.role?.slug !== 'admin') {
    return <Redirect to="/403" />;
  }

  return <Component />;
}
