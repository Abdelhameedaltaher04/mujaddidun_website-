import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext';
import NotFound from '@/pages/not-found';
import { Route, Switch, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();

function Home() {
  const { t } = useLocale();
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-bold text-gray-900" data-testid="text-app-name">
          {t('app.name')}
        </span>
        <LanguageToggle />
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900" data-testid="text-welcome">
            {t('common.welcome')}
          </h1>
          <p className="mt-2 text-sm text-gray-600">{t('app.tagline')}</p>
        </div>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
