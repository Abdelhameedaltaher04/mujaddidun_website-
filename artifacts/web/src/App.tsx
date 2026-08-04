import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { LocaleProvider } from '@/contexts/LocaleContext';
import { Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { useEffect } from 'react';

import HomePage from '@/pages/HomePage';
import AboutPage from '@/pages/AboutPage';
import ProjectsPage from '@/pages/ProjectsPage';
import NewsPage from '@/pages/NewsPage';
import EventsPage from '@/pages/EventsPage';
import GalleryPage from '@/pages/GalleryPage';
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

/**
 * Scrolls to the very top of the page on every route change so users
 * always land at the beginning of the destination page's first section.
 * The navbar is sticky (in normal flow), so no extra offset is needed.
 * Smooth scrolling is used unless the user prefers reduced motion.
 */
function ScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [location]);

  return null;
}

import NewsDetailsPage from '@/pages/NewsDetailsPage';

function Router() {
  return (
    <Switch>
      <Route path="/login" component={LoginPage} />
      <Route path="/" component={HomePage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/projects" component={ProjectsPage} />
      <Route path="/news" component={NewsPage} />
      <Route path="/news/:id" component={NewsDetailsPage} />
      <Route path="/events" component={EventsPage} />
      <Route path="/gallery" component={GalleryPage} />
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
            <ScrollToTop />
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
