import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { useLocale } from '@/contexts/LocaleContext';
import { useAuth } from '@/contexts/AuthContext';
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
import { Link, useParams, useLocation } from 'wouter';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Users,
} from 'lucide-react';
import { usePublicEvent, useRegisterForEvent } from '@/hooks/usePublicEvents';
import { registrationErrorCode } from '@/services/publicEvents';
import { getApiError } from '@/services/api';
import { applySeoMeta } from '@/lib/seo';
import {
  eventDate,
  eventExcerpt,
  eventLocation,
  eventParagraphs,
  eventTimeRange,
  eventTitle,
} from '@/lib/publicEventsPresentation';

export default function EventDetailsPage() {
  const { t, dir, locale } = useLocale();
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const lang = locale as 'ar' | 'en';

  const [loginPromptOpen, setLoginPromptOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const validId = !!id && /^\d+$/.test(id);
  const { data: event, isPending, isError, error, refetch } = usePublicEvent(validId ? id : undefined);
  const register = useRegisterForEvent();

  const status = isError ? getApiError(error).status : undefined;
  const notFound = !validId || status === 404;

  const title = event ? eventTitle(event, lang) : '';
  const excerpt = event ? eventExcerpt(event, lang) : '';

  // SEO: title/description/OG tags from the loaded event.
  useEffect(() => {
    if (!event) return;
    const description = excerpt
      || eventParagraphs(lang === 'ar' ? event.description_ar : event.description_en)[0]
      || '';
    return applySeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: event.image_url
        ? new URL(event.image_url, window.location.origin).href
        : null,
    });
  }, [event, title, excerpt, lang]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const backButton = (
    <Button size="lg" className="mt-8" asChild>
      <Link href="/events">
        <BackIcon className="w-5 h-5 me-2" />
        {t('events.backToEvents')}
      </Link>
    </Button>
  );

  if (notFound || isError) {
    const message = notFound
      ? t('events.notFound')
      : status
        ? t('events.loadError')
        : t('news.networkError');
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader
          title={t('events.title')}
          breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('events.title'), href: '/events' }]}
        />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center" data-testid={notFound ? 'event-details-not-found' : 'event-details-error'}>
          <SectionHeading title={message} description={notFound ? t('events.empty') : ''} accent="primary" />
          {!notFound ? (
            <Button size="lg" className="mt-8" onClick={() => refetch()} data-testid="button-event-details-retry">
              {t('news.retry')}
            </Button>
          ) : null}
          {backButton}
        </main>
        <ContactCtaSection />
        <Footer />
      </div>
    );
  }

  if (isPending || !event) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader
          title={t('events.title')}
          breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('events.title'), href: '/events' }]}
        />
        <main className="flex-1">
          <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
            <div className="max-w-4xl mx-auto" data-testid="event-details-loading">
              <div className="mb-10 flex flex-col items-center gap-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-40" />
              </div>
              <Skeleton className="w-full aspect-[2/1] rounded-3xl mb-12" />
              <div className="space-y-4">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
            </div>
          </SectionWrapper>
        </main>
        <ContactCtaSection />
        <Footer />
      </div>
    );
  }

  const paragraphs = eventParagraphs(lang === 'ar' ? event.description_ar : event.description_en);
  const location = eventLocation(event, lang);
  const timeRange = eventTimeRange(event, lang);
  const showRegistration = event.registration_required && event.status !== 'completed';
  const isRegistering = register.isPending;

  const handleRegister = () => {
    if (event.is_registered || isRegistering) return;
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    setErrorMessage(null);
    register.mutate(event.id, {
      onSuccess: () => setSuccessOpen(true),
      onError: (err) => {
        const code = registrationErrorCode(err);
        if (code === 'already_registered') setErrorMessage(t('events.register.alreadyRegistered'));
        else if (code === 'closed') setErrorMessage(t('events.register.closed'));
        else if (code === 'full') setErrorMessage(t('events.register.full'));
        else {
          const { status: errStatus } = getApiError(err);
          setErrorMessage(errStatus ? t('events.register.error') : t('news.networkError'));
        }
      },
    });
  };

  const registerLabel = event.is_registered
    ? t('events.register.registered')
    : !event.registration_open
      ? event.available_spots === 0
        ? t('events.register.fullBadge')
        : t('events.register.closedBadge')
      : t('home.events.register');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('events.title')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('events.title'), href: '/events' },
          { label: title },
        ]}
      />
      <main className="flex-1">
        <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
          <article className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6 leading-tight text-balance" data-testid="text-event-title">
                {title}
              </h1>
              <div className="flex items-center justify-center text-muted-foreground gap-2 font-medium flex-wrap">
                <CalendarDays className="w-5 h-5 text-primary" />
                <span data-testid="text-event-date">{eventDate(event, lang)}</span>
                {timeRange ? (
                  <>
                    <span className="mx-2 text-border">|</span>
                    <Clock className="w-5 h-5 text-primary" />
                    <span data-testid="text-event-time">{timeRange}</span>
                  </>
                ) : null}
                {location ? (
                  <>
                    <span className="mx-2 text-border">|</span>
                    <MapPin className="w-5 h-5 text-primary" />
                    <span data-testid="text-event-location">{location}</span>
                  </>
                ) : null}
              </div>
            </div>

            {event.image_url ? (
              <div className="w-full aspect-[2/1] rounded-3xl bg-muted border border-border flex items-center justify-center mb-12 shadow-sm overflow-hidden relative">
                <ImageIcon className="w-16 h-16 text-muted-foreground/40 opacity-50" />
                <img
                  src={event.image_url}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover"
                  data-testid="img-event-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ) : null}

            <div className="prose prose-lg dark:prose-invert max-w-none mx-auto space-y-6 text-foreground/90 leading-relaxed mb-12" data-testid="text-event-description">
              {paragraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {/* Registration */}
            {showRegistration ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-2xl border border-border bg-card shadow-sm mb-12" data-testid="event-registration-box">
                <div className="text-center sm:text-start">
                  <p className="font-bold text-foreground mb-1">{t('events.register.boxTitle')}</p>
                  {event.capacity !== null && event.registration_open ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start" data-testid="text-event-capacity">
                      <Users className="w-4 h-4" />
                      {t('events.spotsLeft').replace('{count}', String(event.available_spots ?? 0))}
                    </p>
                  ) : null}
                </div>
                <Button
                  size="lg"
                  disabled={event.is_registered || !event.registration_open || isRegistering}
                  onClick={handleRegister}
                  className="disabled:opacity-100 disabled:bg-success/10 disabled:text-success disabled:border disabled:border-success/40"
                  data-testid="button-register-event-details"
                >
                  {isRegistering ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
                  {registerLabel}
                </Button>
              </div>
            ) : null}

            <div className="flex justify-center py-8 border-t border-border">
              <Button variant="outline" size="lg" asChild>
                <Link href="/events">
                  <BackIcon className="w-5 h-5 me-2" />
                  {t('events.backToEvents')}
                </Link>
              </Button>
            </div>
          </article>
        </SectionWrapper>
      </main>
      <ContactCtaSection />
      <Footer />

      {/* Login required dialog */}
      <Dialog open={loginPromptOpen} onOpenChange={setLoginPromptOpen}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-login-required">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t('events.register.loginRequiredTitle')}</DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('events.register.loginRequiredMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button variant="outline" onClick={() => setLoginPromptOpen(false)} data-testid="button-dialog-cancel">
              {t('events.register.cancelBtn')}
            </Button>
            <Button
              onClick={() => {
                setLoginPromptOpen(false);
                navigate(`/login?redirect=${encodeURIComponent(`/events/${event.id}`)}`);
              }}
              data-testid="button-dialog-login"
            >
              {t('events.register.loginBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-register-success">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t('events.register.successTitle')}</DialogTitle>
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

      {/* Error dialog */}
      <Dialog open={errorMessage !== null} onOpenChange={(open) => { if (!open) setErrorMessage(null); }}>
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-register-error">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t('events.register.errorTitle')}</DialogTitle>
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
