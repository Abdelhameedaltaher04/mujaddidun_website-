import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { FloatingActions } from '@/components/layout/FloatingActions';
import { SessionExpiredDialog } from '@/components/auth/AuthLayout';
import { LocaleProvider } from '@/contexts/LocaleContext';
import {
  Redirect,
  Route,
  Switch,
  Router as WouterRouter,
  useLocation,
} from 'wouter';
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
import RegisterPage from '@/pages/register';
import ForgotPasswordPage from '@/pages/forgot-password';
import ResetPasswordPage from '@/pages/reset-password';
import VerifyEmailPage from '@/pages/verify-email';
import ProfilePage from '@/pages/ProfilePage';
import ForbiddenPage from '@/pages/forbidden';
import NotFound from '@/pages/not-found';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import AdminComingSoonPage from '@/pages/admin/AdminComingSoonPage';
import AdminUsersPage from '@/pages/admin/AdminUsersPage';
import AdminNewsPage from '@/pages/admin/AdminNewsPage';
import AdminNewsFormPage from '@/pages/admin/AdminNewsFormPage';
import AdminEventsPage from '@/pages/admin/AdminEventsPage';
import AdminEventFormPage from '@/pages/admin/AdminEventFormPage';
import AdminEventRegistrationsPage from '@/pages/admin/AdminEventRegistrationsPage';
import AdminProgramsPage from '@/pages/admin/AdminProgramsPage';
import AdminProgramFormPage from '@/pages/admin/AdminProgramFormPage';
import AdminProgramParticipantsPage from '@/pages/admin/AdminProgramParticipantsPage';
import AdminGalleryPage from '@/pages/admin/AdminGalleryPage';
import AdminAlbumDetailsPage from '@/pages/admin/AdminAlbumDetailsPage';
import AdminPartnersPage from '@/pages/admin/AdminPartnersPage';
import AdminFaqsPage from '@/pages/admin/AdminFaqsPage';
import AdminDonationsPage from '@/pages/admin/AdminDonationsPage';
import AdminVolunteersPage from '@/pages/admin/AdminVolunteersPage';
import AdminVolunteerDetailsPage from '@/pages/admin/AdminVolunteerDetailsPage';
import { AdminRoute } from '@/components/admin/AdminRoute';

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
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/verify-email" component={VerifyEmailPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/403" component={ForbiddenPage} />
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/admin/dashboard">
        <AdminRoute component={AdminDashboardPage} />
      </Route>
      <Route path="/admin/users">
        <AdminRoute component={AdminUsersPage} />
      </Route>
      <Route path="/admin/news">
        <AdminRoute component={AdminNewsPage} roles={['admin', 'moderator']} />
      </Route>
      <Route path="/admin/news/new">
        <AdminRoute
          component={AdminNewsFormPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/news/:id/edit">
        <AdminRoute
          component={AdminNewsFormPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/events">
        <AdminRoute
          component={AdminEventsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/events/new">
        <AdminRoute
          component={AdminEventFormPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/events/:id/edit">
        <AdminRoute
          component={AdminEventFormPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/events/:id/registrations">
        <AdminRoute
          component={AdminEventRegistrationsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/programs">
        <AdminRoute
          component={AdminProgramsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/programs/new">
        <AdminRoute
          component={AdminProgramFormPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/programs/:id/edit">
        <AdminRoute
          component={AdminProgramFormPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/programs/:id/participants">
        <AdminRoute
          component={AdminProgramParticipantsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/gallery">
        <AdminRoute
          component={AdminGalleryPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/gallery/:id">
        <AdminRoute
          component={AdminAlbumDetailsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/partners">
        <AdminRoute
          component={AdminPartnersPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/faqs">
        <AdminRoute component={AdminFaqsPage} roles={['admin', 'moderator']} />
      </Route>
      <Route path="/admin/donations">
        <AdminRoute
          component={AdminDonationsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/volunteers/:id">
        <AdminRoute
          component={AdminVolunteerDetailsPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/volunteers">
        <AdminRoute
          component={AdminVolunteersPage}
          roles={['admin', 'moderator']}
        />
      </Route>
      <Route path="/admin/*">
        <AdminRoute component={AdminComingSoonPage} />
      </Route>
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

/**
 * Public-site floating actions (WhatsApp, back-to-top) are hidden inside
 * the admin dashboard so the management UI stays uncluttered.
 */
function PublicChrome() {
  const [location] = useLocation();
  if (location.startsWith('/admin')) return null;
  return <FloatingActions />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <ScrollToTop />
            <Router />
            <PublicChrome />
            <SessionExpiredDialog />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export default App;
