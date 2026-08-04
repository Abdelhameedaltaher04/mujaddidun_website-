import { useAuth } from '@workspace/replit-auth-web';
import { Redirect } from 'wouter';
import { Button } from '@/components/ui/button';

export default function LoginPage() {
  const { isLoading, isAuthenticated, login } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Al-Mujaddidun</h1>
        <p className="text-sm text-gray-600">Sign in to continue</p>
        <Button onClick={login} data-testid="button-login">
          Log in
        </Button>
      </div>
    </div>
  );
}
