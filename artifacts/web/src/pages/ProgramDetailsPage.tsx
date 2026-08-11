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
  CheckCircle2,
  ClipboardList,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Target,
  Users,
} from 'lucide-react';
import { usePublicProgram, useParticipateInProgram } from '@/hooks/usePublicPrograms';
import { participationErrorCode } from '@/services/publicPrograms';
import { getApiError } from '@/services/api';
import { applySeoMeta } from '@/lib/seo';
import {
  programAudience,
  programDate,
  programExcerpt,
  programLocation,
  programParagraphs,
  programTitle,
} from '@/lib/publicProgramsPresentation';

export default function ProgramDetailsPage() {
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
  const { data: program, isPending, isError, error, refetch } = usePublicProgram(validId ? id : undefined);
  const participate = useParticipateInProgram();

  const status = isError ? getApiError(error).status : undefined;
  const notFound = !validId || status === 404;

  const title = program ? programTitle(program, lang) : '';
  const excerpt = program ? programExcerpt(program, lang) : '';

  // SEO: title/description/OG tags from the loaded program.
  useEffect(() => {
    if (!program) return;
    const description = excerpt
      || programParagraphs(lang === 'ar' ? program.description_ar : program.description_en)[0]
      || '';
    return applySeoMeta({
      title,
      description,
      ogTitle: title,
      ogDescription: description,
      ogImage: program.image_url
        ? new URL(program.image_url, window.location.origin).href
        : null,
    });
  }, [program, title, excerpt, lang]);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;

  const backButton = (
    <Button size="lg" className="mt-8" asChild>
      <Link href="/programs">
        <BackIcon className="w-5 h-5 me-2" />
        {t('programs.backToPrograms')}
      </Link>
    </Button>
  );

  if (notFound || isError) {
    const message = notFound
      ? t('programs.notFound')
      : status
        ? t('programs.loadError')
        : t('news.networkError');
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader
          title={t('programs.title')}
          breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('programs.title'), href: '/programs' }]}
        />
        <main className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center" data-testid={notFound ? 'program-details-not-found' : 'program-details-error'}>
          <SectionHeading title={message} description={notFound ? t('programs.empty') : ''} accent="primary" />
          {!notFound ? (
            <Button size="lg" className="mt-8" onClick={() => refetch()} data-testid="button-program-details-retry">
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

  if (isPending || !program) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Navbar />
        <PageHeader
          title={t('programs.title')}
          breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('programs.title'), href: '/programs' }]}
        />
        <main className="flex-1">
          <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
            <div className="max-w-4xl mx-auto" data-testid="program-details-loading">
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

  const description = programParagraphs(lang === 'ar' ? program.description_ar : program.description_en);
  const objectives = programParagraphs(lang === 'ar' ? program.objectives_ar : program.objectives_en);
  const requirements = programParagraphs(lang === 'ar' ? program.requirements_ar : program.requirements_en);
  const location = programLocation(program, lang);
  const audience = programAudience(program, lang);
  const startDate = programDate(program.start_date, lang);
  const endDate = programDate(program.end_date, lang);
  const showParticipation = program.status === 'active';
  const isSubmitting = participate.isPending;

  const handleParticipate = () => {
    if (program.is_participating || isSubmitting) return;
    if (!isAuthenticated) {
      setLoginPromptOpen(true);
      return;
    }
    setErrorMessage(null);
    participate.mutate(program.id, {
      onSuccess: () => setSuccessOpen(true),
      onError: (err) => {
        const code = participationErrorCode(err);
        if (code === 'already_registered') setErrorMessage(t('programs.participate.alreadyRegistered'));
        else if (code === 'closed') setErrorMessage(t('programs.participate.closed'));
        else if (code === 'full') setErrorMessage(t('programs.participate.full'));
        else {
          const { status: errStatus } = getApiError(err);
          setErrorMessage(errStatus ? t('programs.participate.error') : t('news.networkError'));
        }
      },
    });
  };

  const participateLabel = program.is_participating
    ? t('programs.participate.registered')
    : !program.participation_open
      ? program.available_spots === 0
        ? t('programs.participate.fullBadge')
        : t('programs.participate.closedBadge')
      : t('programs.participate.button');

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader
        title={t('programs.title')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' },
          { label: t('programs.title'), href: '/programs' },
          { label: title },
        ]}
      />
      <main className="flex-1">
        <SectionWrapper variant="default" className="pt-12 md:pt-16 pb-20">
          <article className="max-w-4xl mx-auto">
            <div className="mb-10 text-center">
              <span className="inline-block text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full mb-4" data-testid="text-program-category">
                {t(`programs.categories.${program.category}`)}
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold text-foreground mb-6 leading-tight text-balance" data-testid="text-program-title">
                {title}
              </h1>
              <div className="flex items-center justify-center text-muted-foreground gap-2 font-medium flex-wrap">
                {startDate ? (
                  <>
                    <CalendarDays className="w-5 h-5 text-primary" />
                    <span data-testid="text-program-dates">
                      {endDate ? `${startDate} – ${endDate}` : startDate}
                    </span>
                  </>
                ) : null}
                {location ? (
                  <>
                    <span className="mx-2 text-border">|</span>
                    <MapPin className="w-5 h-5 text-primary" />
                    <span data-testid="text-program-location">{location}</span>
                  </>
                ) : null}
                {audience ? (
                  <>
                    <span className="mx-2 text-border">|</span>
                    <Users className="w-5 h-5 text-primary" />
                    <span data-testid="text-program-audience">{audience}</span>
                  </>
                ) : null}
              </div>
            </div>

            {program.image_url ? (
              <div className="w-full aspect-[2/1] rounded-3xl bg-muted border border-border flex items-center justify-center mb-12 shadow-sm overflow-hidden relative">
                <ImageIcon className="w-16 h-16 text-muted-foreground/40 opacity-50" />
                <img
                  src={program.image_url}
                  alt={title}
                  className="absolute inset-0 h-full w-full object-cover"
                  data-testid="img-program-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              </div>
            ) : null}

            <div className="prose prose-lg dark:prose-invert max-w-none mx-auto space-y-6 text-foreground/90 leading-relaxed mb-12" data-testid="text-program-description">
              {description.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>

            {(objectives.length > 0 || requirements.length > 0) ? (
              <div className="grid md:grid-cols-2 gap-6 mb-12">
                {objectives.length > 0 ? (
                  <div className="p-6 rounded-2xl border border-border bg-card shadow-sm" data-testid="program-objectives">
                    <h2 className="flex items-center gap-2 font-bold font-display text-lg mb-4 text-foreground">
                      <Target className="w-5 h-5 text-primary" /> {t('programs.labels.objectives')}
                    </h2>
                    <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
                      {objectives.map((item, index) => (
                        <li key={index} className="flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {requirements.length > 0 ? (
                  <div className="p-6 rounded-2xl border border-border bg-card shadow-sm" data-testid="program-requirements">
                    <h2 className="flex items-center gap-2 font-bold font-display text-lg mb-4 text-foreground">
                      <ClipboardList className="w-5 h-5 text-primary" /> {t('programs.labels.requirements')}
                    </h2>
                    <ul className="space-y-2 text-muted-foreground text-sm leading-relaxed">
                      {requirements.map((item, index) => (
                        <li key={index} className="flex gap-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            ) : null}

            {/* Participation */}
            {showParticipation ? (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 md:p-8 rounded-2xl border border-border bg-card shadow-sm mb-12" data-testid="program-participation-box">
                <div className="text-center sm:text-start">
                  <p className="font-bold text-foreground mb-1">{t('programs.participate.boxTitle')}</p>
                  {program.capacity !== null && program.participation_open ? (
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 justify-center sm:justify-start" data-testid="text-program-capacity">
                      <Users className="w-4 h-4" />
                      {t('programs.spotsLeft').replace('{count}', String(program.available_spots ?? 0))}
                    </p>
                  ) : null}
                </div>
                <Button
                  size="lg"
                  disabled={program.is_participating || !program.participation_open || isSubmitting}
                  onClick={handleParticipate}
                  className="disabled:opacity-100 disabled:bg-success/10 disabled:text-success disabled:border disabled:border-success/40"
                  data-testid="button-participate-program"
                >
                  {isSubmitting ? <Loader2 className="w-4 h-4 me-2 animate-spin" /> : null}
                  {participateLabel}
                </Button>
              </div>
            ) : null}

            <div className="flex justify-center py-8 border-t border-border">
              <Button variant="outline" size="lg" asChild>
                <Link href="/programs">
                  <BackIcon className="w-5 h-5 me-2" />
                  {t('programs.backToPrograms')}
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
              {t('programs.participate.loginRequiredMsg')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2 pt-2">
            <Button variant="outline" onClick={() => setLoginPromptOpen(false)} data-testid="button-dialog-cancel">
              {t('events.register.cancelBtn')}
            </Button>
            <Button
              onClick={() => {
                setLoginPromptOpen(false);
                navigate(`/login?redirect=${encodeURIComponent(`/programs/${program.id}`)}`);
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
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-participate-success">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">{t('events.register.successTitle')}</DialogTitle>
            <DialogDescription className="pt-2 text-base leading-relaxed">
              {t('programs.participate.successMsg')}
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
        <DialogContent className="max-w-md rounded-2xl" data-testid="dialog-participate-error">
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
