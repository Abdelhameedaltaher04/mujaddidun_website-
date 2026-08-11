import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { useLocale } from '@/contexts/LocaleContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { FormContactHelp } from '@/components/layout/FormContactHelp';
import { usePublicEventsList, useRegisterForEvent } from '@/hooks/usePublicEvents';
import { registrationErrorCode, type PublicEventItem, type PublicEventStatus } from '@/services/publicEvents';
import { getApiError } from '@/services/api';
import {
  eventDayMonth,
  eventExcerpt,
  eventLocation,
  eventTimeRange,
  eventTitle,
} from '@/lib/publicEventsPresentation';

const TAB_STATUSES: Record<'upcoming' | 'past', PublicEventStatus[]> = {
  upcoming: ['upcoming', 'ongoing'],
  past: ['completed'],
};

export default function EventsPage() {
  const { t, dir, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const lang = locale as 'ar' | 'en';

  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [page, setPage] = useState(1);
  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingEvent, setPendingEvent] = useState<number | null>(null);

  const list = usePublicEventsList(page, TAB_STATUSES[tab]);
  const register = useRegisterForEvent();

  const events = list.data?.data ?? [];
  const meta = list.data?.meta;

  const handleTabChange = (value: string) => {
    setTab(value === 'past' ? 'past' : 'upcoming');
    setPage(1);
  };

  const handleRegisterClick = (event: PublicEventItem) => {
    if (event.is_registered || register.isPending) return;
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    setPendingEvent(event.id);
    setErrorMessage(null);
    register.mutate(event.id, {
      onSuccess: () => {
        setSuccessOpen(true);
        setPendingEvent(null);
      },
      onError: (error) => {
        setPendingEvent(null);
        const code = registrationErrorCode(error);
        if (code === 'already_registered') {
          setErrorMessage(t('events.register.alreadyRegistered'));
        } else if (code === 'closed') {
          setErrorMessage(t('events.register.closed'));
        } else if (code === 'full') {
          setErrorMessage(t('events.register.full'));
        } else {
          const { status } = getApiError(error);
          setErrorMessage(status ? t('events.register.error') : t('news.networkError'));
        }
      },
    });
  };

  const registerLabel = (event: PublicEventItem): string => {
    if (event.is_registered) return t('events.register.registered');
    if (!event.registration_open) {
      if (event.available_spots === 0) return t('events.register.fullBadge');
      return t('events.register.closedBadge');
    }
    return t('home.events.register');
  };

  const renderCards = () => {
    if (list.isPending) {
      return (
        <div className="grid md:grid-cols-2 gap-6" data-testid="events-list-loading">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4 p-6 rounded-2xl border border-border bg-card">
              <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-9 w-28" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (list.isError) {
      const { status } = getApiError(list.error);
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="events-list-error">
          <p className="text-muted-foreground mb-6">
            {status ? t('events.loadError') : t('news.networkError')}
          </p>
          <Button onClick={() => list.refetch()} data-testid="button-events-retry">
            {t('news.retry')}
          </Button>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl bg-muted/30" data-testid="events-list-empty">
          <p className="text-muted-foreground">{t('events.empty')}</p>
        </div>
      );
    }

    return (
      <div className="grid md:grid-cols-2 gap-6">
        {events.map((event) => {
          const { day, month } = eventDayMonth(event, lang);
          const timeRange = eventTimeRange(event, lang);
          const location = eventLocation(event, lang);
          const isRegistering = register.isPending && pendingEvent === event.id;
          return (
            <div
              key={event.id}
              className="flex flex-col rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group overflow-hidden"
              data-testid={`event-card-${event.id}`}
            >
              {event.image_url ? (
                <Link href={`/events/${event.id}`} className="block aspect-[16/7] bg-muted relative overflow-hidden">
                  <ImageIcon className="w-10 h-10 text-muted-foreground/30 absolute inset-0 m-auto" />
                  <img
                    src={event.image_url}
                    alt={eventTitle(event, lang)}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </Link>
              ) : null}
              <div className="flex gap-4 p-6 flex-1">
                <div className="w-20 h-20 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                  <span className="text-2xl font-bold font-display leading-none">{day}</span>
                  <span className="text-sm font-medium">{month}</span>
                </div>
                <div className="flex flex-col flex-1 min-w-0">
                  <Link href={`/events/${event.id}`}>
                    <h3 className="text-xl font-bold font-display mb-2 group-hover:text-primary transition-colors" data-testid={`text-event-title-${event.id}`}>
                      {eventTitle(event, lang)}
                    </h3>
                  </Link>
                  <div className="text-sm text-muted-foreground flex flex-wrap gap-3 mb-3">
                    {location ? (
                      <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {location}</span>
                    ) : null}
                    {timeRange ? (
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {timeRange}</span>
                    ) : null}
                    {event.capacity !== null && event.registration_open ? (
                      <span className="flex items-center gap-1" data-testid={`text-event-spots-${event.id}`}>
                        <Users className="w-4 h-4" /> {t('events.spotsLeft').replace('{count}', String(event.available_spots ?? 0))}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{eventExcerpt(event, lang)}</p>
                  <div className="mt-auto flex flex-wrap items-center gap-3">
                    {event.registration_required && event.status !== 'completed' ? (
                      <Button
                        variant="outline"
                        disabled={event.is_registered || !event.registration_open || isRegistering}
                        onClick={() => handleRegisterClick(event)}
                        className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors disabled:opacity-100 disabled:bg-success/10 disabled:text-success disabled:border-success/40 disabled:group-hover:bg-success/10 disabled:group-hover:text-success disabled:group-hover:border-success/40"
                        data-testid={`button-register-event-${event.id}`}
                      >
                        {isRegistering ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
                        {registerLabel(event)}
                      </Button>
                    ) : null}
                    <Button variant="ghost" asChild data-testid={`link-event-details-${event.id}`}>
                      <Link href={`/events/${event.id}`}>{t('common.readMore')}</Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const PrevIcon = dir === 'rtl' ? ChevronRight : ChevronLeft;
  const NextIcon = dir === 'rtl' ? ChevronLeft : ChevronRight;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('events.title')} 
        description={t('events.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('events.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <Tabs value={tab} onValueChange={handleTabChange} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                <TabsTrigger value="upcoming" data-testid="tab-events-upcoming">{t('events.upcoming')}</TabsTrigger>
                <TabsTrigger value="past" data-testid="tab-events-past">{t('events.past')}</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={tab} forceMount>
              {renderCards()}
              {meta && meta.last_page > 1 ? (
                <div className="mt-10 flex items-center justify-center gap-4" data-testid="events-pagination">
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page <= 1 || list.isFetching}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    aria-label={t('news.prevPage')}
                    data-testid="button-events-prev-page"
                  >
                    <PrevIcon className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground font-medium">
                    {meta.current_page} / {meta.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={page >= meta.last_page || list.isFetching}
                    onClick={() => setPage((p) => p + 1)}
                    aria-label={t('news.nextPage')}
                    data-testid="button-events-next-page"
                  >
                    <NextIcon className="w-4 h-4" />
                  </Button>
                </div>
              ) : null}
            </TabsContent>
          </Tabs>
          <FormContactHelp />
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />

      {/* Login required dialog (guests) */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-login-required">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {t('events.register.loginRequiredTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('events.register.loginRequiredMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setLoginPromptOpen(false)}
              data-testid="button-dialog-cancel"
            >
              {t('events.register.cancelBtn')}
            </Button>
            <Button
              onClick={() => {
                setLoginPromptOpen(false);
                navigate(`/login?redirect=${encodeURIComponent('/events')}`);
              }}
              data-testid="button-dialog-login"
            >
              {t('events.register.loginBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration success dialog (authenticated users) */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-register-success">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {t('events.register.successTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('events.register.successMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button onClick={() => setSuccessOpen(false)} data-testid="button-dialog-ok">
              {t('events.register.okBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registration error dialog */}
      <Dialog open={errorMessage !== null} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-register-error">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">
              {t('events.register.errorTitle')}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button onClick={() => setErrorMessage(null)} data-testid="button-dialog-error-ok">
              {t('events.register.okBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
