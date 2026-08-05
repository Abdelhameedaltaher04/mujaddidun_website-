import { useAuth } from '@/contexts/AuthContext';
import { Redirect, useLocation } from 'wouter';
import type { ComponentType } from 'react';

export function ProtectedRoute({
  component: Component,
}: {
  component: ComponentType;
}) {
  const { isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to={`/login?redirect=${encodeURIComponent(location)}`} />;
  }

  return <Component />;
}
