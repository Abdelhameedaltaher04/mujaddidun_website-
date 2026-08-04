import { useAuth } from '@workspace/replit-auth-web';
import { Redirect } from 'wouter';
import type { ComponentType } from 'react';

export function ProtectedRoute({
  component: Component,
}: {
  component: ComponentType;
}) {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component />;
}
