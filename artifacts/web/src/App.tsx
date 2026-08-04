import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Route, Switch, Router as WouterRouter } from 'wouter';

import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ProjectsPage from '@/pages/ProjectsPage';
import NewsPage from '@/pages/NewsPage';
import EventsPage from '@/pages/EventsPage';
import GalleryPage from '@/pages/GalleryPage';
import ReportsPage from '@/pages/ReportsPage';
import SuccessStoriesPage from '@/pages/SuccessStoriesPage';
import PartnersPage from '@/pages/PartnersPage';
import FaqPage from '@/pages/FaqPage';
import ContactPage from '@/pages/ContactPage';
import VolunteerPage from '@/pages/VolunteerPage';
import ProgramsPage from '@/pages/ProgramsPage';
import DonatePage from '@/pages/DonatePage';

import LoginPage from '@/pages/login';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/gallery" component={GalleryPage} />
      <Route path="/reports" component={ReportsPage} />
      <Route path="/success-stories" component={SuccessStoriesPage} />
      <Route path="/partners" component={PartnersPage} />
      <Route path="/faq" component={FaqPage} />
      <Route path="/contact" component={ContactPage} />
      <Route path="/volunteer" component={VolunteerPage} />
      <Route path="/programs" component={ProgramsPage} />
      <Route path="/donate" component={DonatePage} />
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
