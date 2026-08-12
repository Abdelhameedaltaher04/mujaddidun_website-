import { Navbar } from '@/components/layout/Navbar';
import { Fragment, useState } from 'react';
import { Footer } from '@/components/layout/Footer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { MainContainer } from '@/components/layout/MainContainer';
import { StatCounter } from '@/components/layout/StatCounter';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Heart, Home, GraduationCap, ArrowLeft, ArrowRight, Users, ChevronLeft, MapPin } from 'lucide-react';
import { PartnersCarousel } from '@/components/layout/PartnersCarousel';
import { ContactCtaSection } from '@/components/layout/ContactCtaSection';
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/mujaddidun-logo.png';
import { Skeleton } from '@/components/ui/skeleton';
import { usePublicNewsList } from '@/hooks/usePublicNews';
import { newsDate, newsTitle } from '@/lib/publicNewsPresentation';
import { usePublicEventsList } from '@/hooks/usePublicEvents';
import { eventDayMonth, eventLocation, eventTitle } from '@/lib/publicEventsPresentation';
import { usePublicProgramsList } from '@/hooks/usePublicPrograms';
import { programExcerpt, programTitle } from '@/lib/publicProgramsPresentation';
import { usePublicContent } from '@/hooks/usePublicContent';
import { safeExternalUrl } from '@/hooks/usePublicSettings';
import type { HomepageSectionKey } from '@/services/adminContent';

const HERO_FALLBACK_BG =
  "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2940&auto=format&fit=crop";

/** Order used until /public/content loads (matches the seeded defaults). */
const DEFAULT_SECTION_ORDER: HomepageSectionKey[] = [
  'hero', 'statistics', 'about', 'programs', 'news_events',
  'volunteer_cta', 'partners', 'faq', 'contact',
];

/** "10+" → {target: 10, suffix: "+"}; "50k+" → {target: 50, suffix: "k+"}. */
function parseStatNumber(raw: string): { target: number; suffix: string } | null {
  const match = /^(\d+(?:\.\d+)?)(.*)$/.exec(raw.trim());
  if (!match) return null;
  return { target: Number(match[1]), suffix: match[2] };
}

/** Renders content-managed button links: internal via wouter, external sanitized. */
function CtaLink({ url, children, ...buttonProps }: { url: string | null } & React.ComponentProps<typeof Button>) {
  if (url && url.startsWith('/')) {
    return (
      <Button {...buttonProps} asChild>
        <Link href={url}>{children}</Link>
      </Button>
    );
  }
  const external = safeExternalUrl(url);
  if (external) {
    return (
      <Button {...buttonProps} asChild>
        <a href={external} target="_blank" rel="noopener noreferrer">{children}</a>
      </Button>
    );
  }
  return <Button {...buttonProps}>{children}</Button>;
}

export default function HomePage() {
  const { t, dir, locale } = useLocale();
  const homeLang = locale as 'ar' | 'en';
  const latestNews = usePublicNewsList(1);
  const upcomingEvents = usePublicEventsList(1, ['upcoming', 'ongoing']);
  const homeEvents = (upcomingEvents.data?.data ?? []).slice(0, 2);
  const activePrograms = usePublicProgramsList({ status: 'active', per_page: 3 });
  const homePrograms = (activePrograms.data?.data ?? []).slice(0, 3);
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const [faqExpanded, setFaqExpanded] = useState(false);

  // Admin-managed website content; every consumer below must fall back to
  // the bundled translations while it loads (or if the API is unreachable)
  // so the homepage always renders.
  const content = usePublicContent();
  // Requested locale → other stored locale → caller's translation fallback.
  const pick = (ar: string | null | undefined, en: string | null | undefined) => {
    const [first, second] = locale === 'ar' ? [ar, en] : [en, ar];
    return (first ?? '').trim() || (second ?? '').trim();
  };
  const hero = content?.sections.hero;
  const about = content?.sections.about;
  const visionMission = content?.sections.vision_mission;

  const heroTitle = pick(hero?.title_ar, hero?.title_en) || t('projects.subtitle');
  const heroDescription = pick(hero?.description_ar, hero?.description_en) || t('about.visionText');
  const heroPrimaryText = hero ? pick(hero.primary_button_text_ar, hero.primary_button_text_en) : t('common.donate');
  const heroSecondaryText = hero ? pick(hero.secondary_button_text_ar, hero.secondary_button_text_en) : t('about.story');
  const heroBg = hero?.background_image_url || HERO_FALLBACK_BG;

  const aboutTitle = pick(about?.title_ar, about?.title_en) || t('about.title');
  const aboutDescription = pick(about?.description_ar, about?.description_en) || t('about.storyText');
  const missionText = pick(visionMission?.mission_ar, visionMission?.mission_en) || t('about.missionText');
  const visionText = pick(visionMission?.vision_ar, visionMission?.vision_en) || t('about.visionText');
  const showVisionMission = visionMission?.is_active !== false;

  const statistics = content?.statistics;
  const ctas = content?.ctas;

  // Server order first, then any sections missing from the payload appended
  // in default order (visible) so a partial payload never drops sections.
  const serverSections = content?.homepage_sections?.length
    ? [...content.homepage_sections].sort((a, b) => a.display_order - b.display_order)
    : [];
  const seenKeys = new Set(serverSections.map((s) => s.section_key));
  const orderedSections: Array<{ section_key: HomepageSectionKey; is_visible: boolean }> = [
    ...serverSections.filter(
      (s) => (DEFAULT_SECTION_ORDER as string[]).includes(s.section_key),
    ),
    ...DEFAULT_SECTION_ORDER.filter((key) => !seenKeys.has(key)).map((key) => ({
      section_key: key,
      is_visible: true,
    })),
  ];

  const renderHero = () => {
    if (hero && !hero.is_active) return null;
    return (
      <section className="relative min-h-[85vh] lg:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-primary text-primary-foreground">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: `url('${heroBg}')` }}
        ></div>

        <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/90 to-primary/95"></div>
        <div className="absolute top-0 start-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-secondary/30 rounded-full blur-[100px] lg:blur-[120px] opacity-40 mix-blend-screen pointer-events-none transform -translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute bottom-0 end-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-info/40 rounded-full blur-[100px] lg:blur-[120px] opacity-30 mix-blend-screen pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>

        <div className="container-wide relative z-10 py-20 flex flex-col items-center text-center mt-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold max-w-5xl tracking-tight text-balance mb-8 drop-shadow-sm animate-hero-up" style={{ animationDelay: '0.2s' }} data-testid="text-hero-title">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-primary-foreground/90 mb-12 text-balance font-medium leading-relaxed animate-hero-up" style={{ animationDelay: '0.3s' }} data-testid="text-hero-description">
            {heroDescription}
          </p>
          <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-hero-up" style={{ animationDelay: '0.4s' }}>
            {heroPrimaryText ? (
              <CtaLink
                url={hero?.primary_button_url ?? '/donate'}
                size="lg"
                variant="secondary"
                className="px-10 h-14 text-lg font-bold shadow-[0_0_40px_-10px_rgba(255,88,16,0.6)] transition-all hover:scale-105 hover-elevate-2"
                data-testid="button-hero-primary"
              >
                {heroPrimaryText} <Heart className="w-5 h-5 ms-2" />
              </CtaLink>
            ) : null}
            {heroSecondaryText ? (
              <CtaLink
                url={hero?.secondary_button_url ?? '/about'}
                size="lg"
                variant="outline"
                className="px-10 h-14 text-lg font-bold border-primary-foreground/30 text-primary-foreground bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/15 transition-all"
                data-testid="button-hero-secondary"
              >
                {heroSecondaryText} <ArrowIcon className="w-5 h-5 ms-2" />
              </CtaLink>
            ) : null}
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
      </section>
    );
  };

  const renderStatistics = () => {
    if (statistics && statistics.length === 0) return null;
    return (
      <SectionWrapper id="statistics" className="pt-8 pb-12 md:pt-12 md:pb-16 -mt-16 relative z-20">
        <SectionHeading
          kicker={t('home.sections.statistics')}
          title={t('common.ourImpact')}
          size="md"
          accent="secondary"
          className="mb-6 lg:mb-8"
        />
        <div
          className={cn(
            'grid grid-cols-2 gap-4 md:gap-6 bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8 animate-hero-up',
            (statistics?.length ?? 4) % 3 === 0 ? 'md:grid-cols-3' : 'md:grid-cols-4',
          )}
          style={{ animationDelay: '0.6s' }}
        >
          {statistics ? (
            statistics.map((stat, index) => {
              const parsed = parseStatNumber(stat.number);
              const label = pick(stat.label_ar, stat.label_en);
              const colorClass = index % 2 === 0 ? 'text-primary' : 'text-secondary';
              return parsed ? (
                <StatCounter
                  key={stat.id}
                  target={parsed.target}
                  suffix={parsed.suffix}
                  label={label}
                  duration={1400 + index * 250}
                  colorClass={colorClass}
                />
              ) : (
                <div key={stat.id} className="text-center">
                  <div className={cn('text-4xl md:text-5xl font-bold font-display', colorClass)}>{stat.number}</div>
                  <div className="mt-2 text-sm md:text-base text-muted-foreground font-medium">{label}</div>
                </div>
              );
            })
          ) : (
            <>
              <StatCounter target={10} suffix="+" label={t('home.stats.years')} duration={1400} colorClass="text-primary" />
              <StatCounter target={50} suffix="k+" label={t('home.stats.beneficiaries')} duration={2200} colorClass="text-secondary" />
              <StatCounter target={500} suffix="+" label={t('home.stats.volunteers')} duration={1900} colorClass="text-primary" />
              <StatCounter target={20} suffix="+" label={t('home.stats.projects')} duration={1650} colorClass="text-secondary" />
            </>
          )}
        </div>
      </SectionWrapper>
    );
  };

  const renderAbout = () => {
    if (about?.is_active === false && !showVisionMission) return null;
    return (
      <SectionWrapper id="about" variant="muted">
        <SectionHeading
          kicker={t('about.story')}
          title={aboutTitle}
          accent="primary"
        />

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          <div className="space-y-6">
            {about?.is_active === false ? null : (
              <p className="text-lg text-muted-foreground leading-relaxed" data-testid="text-about-description">
                {aboutDescription}
              </p>
            )}

            {showVisionMission ? (
              <>
                <blockquote className="border-s-4 border-secondary ps-5 py-1">
                  <p className="text-foreground font-medium leading-relaxed italic" data-testid="text-mission">
                    {missionText}
                  </p>
                  <span className="block text-sm font-bold text-secondary mt-2">
                    {t('about.mission')}
                  </span>
                </blockquote>

                <blockquote className="border-s-4 border-primary ps-5 py-1">
                  <p className="text-foreground font-medium leading-relaxed italic" data-testid="text-vision">
                    {visionText}
                  </p>
                  <span className="block text-sm font-bold text-primary mt-2">
                    {t('about.vision')}
                  </span>
                </blockquote>
              </>
            ) : null}

            <Button variant="link" className="p-0 h-auto text-primary font-bold group" asChild>
              <Link href="/about">
                {t('common.readMore')} <ArrowIcon className="w-4 h-4 ms-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="relative order-first lg:order-none w-full lg:-translate-x-4 lg:scale-[1.04]">
            <div className="aspect-[7/5] rounded-3xl bg-primary/5 border border-primary/10 overflow-hidden shadow-xl shadow-primary/10">
              <img
                src={about?.image_url || logoUrl}
                alt={aboutTitle || t('app.name')}
                className="h-full w-full object-cover object-center"
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = logoUrl;
                }}
                data-testid="img-about-logo"
              />
            </div>
          </div>
        </div>
      </SectionWrapper>
    );
  };

  const renderPrograms = () => (
    <SectionWrapper id="programs" variant="default">
      <SectionHeading
        title={t('home.sections.programs')}
        description={t('programs.subtitle')}
        align="start"
        accent="primary"
        action={
          <Button variant="outline" className="font-bold" asChild>
            <Link href="/programs">
              {t('common.viewAll')} <ArrowIcon className="w-4 h-4 ms-2" />
            </Link>
          </Button>
        }
      />
      <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
        {homePrograms.length > 0 ? homePrograms.map((program, index) => (
          <Link key={program.id} href={`/programs/${program.id}`} className="flex flex-col bg-card rounded-2xl border border-border shadow-sm hover-elevate transition-all overflow-hidden group" data-testid={`home-program-${program.id}`}>
            <div className="p-6 md:p-8 flex-1 flex flex-col">
              <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center mb-6",
                index === 0 ? 'text-primary bg-primary/10' :
                index === 1 ? 'text-secondary bg-secondary/10' : 'text-info bg-info/10')}>
                {index === 0 ? <Heart className="w-8 h-8" /> :
                 index === 1 ? <Home className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
              </div>
              <h3 className="text-2xl font-bold font-display mb-3 text-foreground group-hover:text-primary transition-colors">
                {programTitle(program, homeLang)}
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                {programExcerpt(program, homeLang)}
              </p>
            </div>
          </Link>
        )) : (
          <p className="text-muted-foreground text-sm py-4 md:col-span-3">{t('programs.empty')}</p>
        )}
      </div>
    </SectionWrapper>
  );

  const renderNewsEvents = () => (
    <SectionWrapper id="news-events" variant="muted">
       <div className="grid lg:grid-cols-2 gap-12">
          <div>
             <SectionHeading
               title={t('home.sections.latestNews')}
               align="start"
               size="md"
               accent="primary"
               className="mb-8"
               action={
                 <Button variant="ghost" size="sm" asChild>
                   <Link href="/news">{t('common.viewAll')}</Link>
                 </Button>
               }
             />
             <div className="space-y-4">
                {latestNews.isPending ? (
                   [1, 2].map((i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-border bg-card shadow-sm items-start sm:items-center">
                         <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
                         <div className="flex flex-col justify-center flex-1 gap-2 w-full">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-5 w-full" />
                         </div>
                      </div>
                   ))
                ) : latestNews.data && latestNews.data.data.length > 0 ? (
                   latestNews.data.data.slice(0, 2).map((item) => (
                      <div key={item.id} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group h-full items-start sm:items-center">
                         <div className="w-24 h-24 rounded-xl bg-muted shrink-0 relative overflow-hidden flex items-center justify-center">
                            {item.featured_image_url ? (
                               <img
                                  src={item.featured_image_url}
                                  alt={newsTitle(item, locale as 'ar' | 'en')}
                                  loading="lazy"
                                  className="absolute inset-0 h-full w-full object-cover"
                                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                               />
                            ) : null}
                            <div className="absolute inset-0 bg-primary/10"></div>
                         </div>
                         <div className="flex flex-col justify-center flex-1">
                            <div className="text-sm font-medium text-primary mb-2">{newsDate(item, locale as 'ar' | 'en')}</div>
                            <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{newsTitle(item, locale as 'ar' | 'en')}</h4>
                         </div>
                         <div className="flex items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                            <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                              <Link href={`/news/${item.id}`}>{t('common.readMore')}</Link>
                            </Button>
                         </div>
                      </div>
                   ))
                ) : latestNews.isError ? (
                   <div className="py-4 flex flex-col items-start gap-3">
                      <p className="text-muted-foreground text-sm">{t('news.loadError')}</p>
                      <Button variant="outline" size="sm" onClick={() => latestNews.refetch()} data-testid="button-home-news-retry">
                         {t('news.retry')}
                      </Button>
                   </div>
                ) : (
                   <p className="text-muted-foreground text-sm py-4">{t('news.empty')}</p>
                )}
             </div>
          </div>
          <div>
             <SectionHeading
               title={t('home.sections.upcomingEvents')}
               align="start"
               size="md"
               accent="secondary"
               className="mb-8"
               action={
                 <Button variant="ghost" size="sm" asChild>
                   <Link href="/events">{t('common.viewAll')}</Link>
                 </Button>
               }
             />
             <div className="space-y-4">
                {homeEvents.length > 0 ? homeEvents.map((event) => {
                   const { day, month } = eventDayMonth(event, homeLang);
                   return (
                   <div key={event.id} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group h-full items-start sm:items-center" data-testid={`home-event-${event.id}`}>
                      <div className="w-24 h-24 rounded-xl bg-secondary/10 flex flex-col items-center justify-center shrink-0 text-secondary">
                         <span className="text-2xl font-bold font-display leading-none mb-1">{day}</span>
                         <span className="text-sm font-medium uppercase tracking-wider">{month}</span>
                      </div>
                      <div className="flex flex-col justify-center flex-1">
                         <div className="text-sm font-medium text-secondary mb-2 flex items-center gap-1">
                            <MapPin className="w-4 h-4 shrink-0" /> {eventLocation(event, homeLang)}
                         </div>
                         <h4 className="font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-2">{eventTitle(event, homeLang)}</h4>
                      </div>
                      <div className="flex items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                         <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-colors" asChild>
                           <Link href={`/events/${event.id}`}>{t('home.events.register')}</Link>
                         </Button>
                      </div>
                   </div>
                   );
                }) : (
                   <p className="text-muted-foreground text-sm py-4">{t('events.empty')}</p>
                )}
             </div>
          </div>
       </div>
    </SectionWrapper>
  );

  const renderVolunteerCta = () => {
    // Admin-managed CTA sections; hidden entirely when the admin
    // deactivates every CTA. Falls back to the translation-driven CTA
    // while content loads.
    if (ctas && ctas.length === 0) return null;
    if (!ctas) {
      return (
        <SectionWrapper id="volunteer-cta" className="relative overflow-hidden border-y border-border py-4 md:py-6" variant="default">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="relative z-10 max-w-4xl mx-auto text-center py-3 md:py-4">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
              <Users className="w-8 h-8" />
            </div>
            <SectionHeading
              kicker={t('home.sections.volunteerCta')}
              title={t('volunteer.subtitle')}
              description={t('common.volunteerDesc')}
              accent="secondary"
              className="mb-4 lg:mb-5 max-w-none mx-auto [&>div]:max-w-none"
              titleClassName={cn(
                'whitespace-nowrap text-nowrap',
                dir === 'rtl'
                  ? 'text-[clamp(0.75rem,3vw,1.875rem)]'
                  : 'text-[clamp(0.7rem,2.3vw,1.5rem)]',
              )}
            />
            <Button size="lg" className="px-10 h-14 text-lg font-bold shadow-md hover-elevate" asChild>
              <Link href="/volunteer">{t('common.volunteerCTA')}</Link>
            </Button>
          </div>
        </SectionWrapper>
      );
    }
    return (
      <SectionWrapper id="volunteer-cta" className="relative overflow-hidden border-y border-border py-4 md:py-6" variant="default">
        <div className="absolute inset-0 bg-primary/5"></div>
        <div className="relative z-10 max-w-4xl mx-auto text-center py-3 md:py-4 space-y-10">
          {ctas.map((cta, index) => {
            const title = pick(cta.title_ar, cta.title_en);
            const description = pick(cta.description_ar, cta.description_en);
            const buttonText = pick(cta.button_text_ar, cta.button_text_en);
            return (
              <div key={cta.id} data-testid={`home-cta-${cta.id}`}>
                {index === 0 && !cta.image_url ? (
                  <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm">
                    <Users className="w-8 h-8" />
                  </div>
                ) : null}
                {cta.image_url ? (
                  <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-4 shadow-sm border border-border">
                    <img src={cta.image_url} alt={title} className="h-full w-full object-cover" />
                  </div>
                ) : null}
                <SectionHeading
                  kicker={t('home.sections.volunteerCta')}
                  title={title}
                  description={description || undefined}
                  accent="secondary"
                  className="mb-4 lg:mb-5 max-w-none mx-auto [&>div]:max-w-none"
                  titleClassName={cn(
                    'whitespace-nowrap text-nowrap',
                    dir === 'rtl'
                      ? 'text-[clamp(0.75rem,3vw,1.875rem)]'
                      : 'text-[clamp(0.7rem,2.3vw,1.5rem)]',
                  )}
                />
                {buttonText ? (
                  <CtaLink
                    url={cta.button_url}
                    size="lg"
                    className="px-10 h-14 text-lg font-bold shadow-md hover-elevate"
                    data-testid={`button-home-cta-${cta.id}`}
                  >
                    {buttonText}
                  </CtaLink>
                ) : null}
              </div>
            );
          })}
        </div>
      </SectionWrapper>
    );
  };

  const renderPartners = () => (
    <section id="partners" className="relative w-full overflow-hidden bg-muted py-12 md:py-16">
       <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 opacity-50 pointer-events-none"></div>
       <div className="absolute top-1/2 start-1/4 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[100px] opacity-30 mix-blend-screen pointer-events-none transform -translate-y-1/2 motion-safe:animate-pulse" style={{ animationDuration: '8s' }}></div>
       <div className="absolute top-1/2 end-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] opacity-30 mix-blend-screen pointer-events-none transform -translate-y-1/2 motion-safe:animate-pulse" style={{ animationDuration: '10s' }}></div>

       <div className="relative z-10">
         <MainContainer>
           <SectionHeading
             kicker={t('home.sections.partners')}
             title={t('partners.title')}
             description={t('partners.subtitle')}
             accent="secondary"
           />
         </MainContainer>
         <PartnersCarousel />
       </div>
    </section>
  );

  const renderFaq = () => (
    <SectionWrapper id="faq" variant="default">
      <div className="max-w-3xl mx-auto">
        <SectionHeading
          title={t('home.sections.faq')}
          description={t('faq.subtitle')}
          accent="secondary"
        />
        <div className="space-y-4" id="home-faq-items">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div
              key={i}
              className={cn(
                'grid transition-[grid-template-rows,opacity] duration-500 ease-in-out',
                i > 2 && !faqExpanded
                  ? 'grid-rows-[0fr] opacity-0 pointer-events-none'
                  : 'grid-rows-[1fr] opacity-100',
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <details className="group bg-card border border-border rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm">
                  <summary className="flex items-center justify-between p-6 font-bold cursor-pointer hover:bg-muted/50 transition-colors focus-ring-standard text-foreground">
                    <span className="pe-4">{t(`faq.items.${i}.q`)}</span>
                    <span className="w-8 h-8 rounded-full bg-primary/5 text-primary flex items-center justify-center shrink-0 group-open:rotate-180 transition-transform">
                      <ChevronLeft className="w-5 h-5 -rotate-90" />
                    </span>
                  </summary>
                  <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                    {t(`faq.items.${i}.a`)}
                  </div>
                </details>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button
            type="button"
            variant="link"
            className="font-bold text-primary text-lg"
            onClick={() => setFaqExpanded((expanded) => !expanded)}
            aria-expanded={faqExpanded}
            aria-controls="home-faq-items"
            data-testid="button-faq-toggle"
          >
            {faqExpanded ? t('common.readLess') : t('common.readMore')}
            <ArrowIcon
              className={cn(
                'w-5 h-5 ms-2 transition-transform duration-300',
                faqExpanded && 'rotate-180',
              )}
            />
          </Button>
        </div>
      </div>
    </SectionWrapper>
  );

  const SECTION_RENDERERS: Record<HomepageSectionKey, () => React.ReactNode> = {
    hero: renderHero,
    statistics: renderStatistics,
    about: renderAbout,
    programs: renderPrograms,
    news_events: renderNewsEvents,
    volunteer_cta: renderVolunteerCta,
    partners: renderPartners,
    faq: renderFaq,
    contact: () => <ContactCtaSection id="contact" />,
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {orderedSections
          .filter((section) => section.is_visible)
          .map((section) => (
            <Fragment key={section.section_key}>
              {SECTION_RENDERERS[section.section_key]?.()}
            </Fragment>
          ))}
      </main>
      <Footer />
    </div>
  );
}
