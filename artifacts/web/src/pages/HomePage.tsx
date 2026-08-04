import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Heart, Home, GraduationCap, ArrowLeft, ArrowRight, Users, CheckCircle2, TrendingUp, Phone, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

function PartnersCarousel({ items, t, dir }: { items: number[], t: (key: string) => string, dir: string }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: true, 
    direction: dir as 'rtl' | 'ltr',
    align: 'start',
  });
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!emblaApi) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const interval = setInterval(() => {
      if (!isPaused) {
        emblaApi.scrollNext();
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [emblaApi, isPaused]);

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  return (
    <div 
      className="relative max-w-6xl mx-auto px-12 group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex touch-pan-y -ms-4 py-4" style={{ backfaceVisibility: 'hidden' }}>
          {items.map((i) => (
            <div key={i} className="flex-[0_0_50%] md:flex-[0_0_25%] lg:flex-[0_0_20%] min-w-0 ps-4">
              <div className="h-28 bg-card rounded-2xl border border-border flex items-center justify-center p-4 grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all shadow-sm hover-elevate">
                <span className="font-display font-bold text-center text-sm md:text-base text-foreground">{t(`partners.items.${i}`)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-1/2 -translate-y-1/2 start-0 rounded-full w-10 h-10 bg-background/80 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity focus-ring-standard"
        onClick={scrollPrev}
        aria-label={t('common.previous')}
      >
        {dir === 'rtl' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </Button>
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-1/2 -translate-y-1/2 end-0 rounded-full w-10 h-10 bg-background/80 backdrop-blur-sm z-10 opacity-0 group-hover:opacity-100 transition-opacity focus-ring-standard"
        onClick={scrollNext}
        aria-label={t('common.next')}
      >
        {dir === 'rtl' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
      </Button>
    </div>
  );
}

export default function HomePage() {
  const { t, dir } = useLocale();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative min-h-[85vh] lg:min-h-[90vh] flex flex-col justify-center overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"></div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-primary/95 via-primary/90 to-primary/95"></div>
          <div className="absolute top-0 start-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-secondary/30 rounded-full blur-[100px] lg:blur-[120px] opacity-40 mix-blend-screen pointer-events-none transform -translate-x-1/3 -translate-y-1/3"></div>
          <div className="absolute bottom-0 end-0 w-[400px] lg:w-[600px] h-[400px] lg:h-[600px] bg-info/40 rounded-full blur-[100px] lg:blur-[120px] opacity-30 mix-blend-screen pointer-events-none transform translate-x-1/3 translate-y-1/3"></div>
          
          <div className="container-wide relative z-10 py-20 flex flex-col items-center text-center mt-10">
            <h1 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold max-w-5xl tracking-tight text-balance mb-8 drop-shadow-sm animate-hero-up" style={{ animationDelay: '0.2s' }}>
              {t('projects.subtitle')}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl max-w-3xl text-primary-foreground/90 mb-12 text-balance font-medium leading-relaxed animate-hero-up" style={{ animationDelay: '0.3s' }}>
              {t('about.visionText')}
            </p>
            <div className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto animate-hero-up" style={{ animationDelay: '0.4s' }}>
              <Button size="lg" className="px-10 h-14 text-lg font-bold bg-secondary text-secondary-foreground hover:bg-secondary/90 shadow-[0_0_40px_-10px_rgba(255,88,16,0.6)] border-none transition-all hover:scale-105" asChild>
                <Link href="/donate">{t('common.donate')} <Heart className="w-5 h-5 ms-2" /></Link>
              </Button>
              <Button size="lg" variant="outline" className="px-10 h-14 text-lg font-bold border-primary-foreground/30 text-primary-foreground bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/15 transition-all" asChild>
                <Link href="/about">{t('about.story')} <ArrowIcon className="w-5 h-5 ms-2" /></Link>
              </Button>
            </div>
          </div>
          
          <div className="absolute bottom-0 inset-x-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none"></div>
        </section>

        {/* STATISTICS SECTION */}
        <SectionWrapper id="statistics" className="py-8 md:py-12 -mt-16 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8 animate-hero-up" style={{ animationDelay: '0.6s' }}>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-5xl font-display font-bold text-primary">10+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.years')}</div>
             </div>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-5xl font-display font-bold text-secondary">50k+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.beneficiaries')}</div>
             </div>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-5xl font-display font-bold text-primary">500+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.volunteers')}</div>
             </div>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-5xl font-display font-bold text-secondary">20+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.projects')}</div>
             </div>
          </div>
        </SectionWrapper>

        {/* ABOUT PREVIEW */}
        <SectionWrapper id="about-preview" variant="muted">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-display font-bold text-foreground">
                {t('about.title')}
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('about.storyText')}
              </p>
              <ul className="space-y-3">
                {[t('about.valuesText1'), t('about.valuesText2'), t('about.valuesText3')].map((val, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                    <span className="text-foreground font-medium">{val.split(':')[0]}</span>
                  </li>
                ))}
              </ul>
              <Button variant="link" className="p-0 h-auto text-primary font-bold group" asChild>
                <Link href="/about">
                  {t('common.readMore')} <ArrowIcon className="w-4 h-4 ms-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <div className="relative">
               <div className="aspect-square md:aspect-[4/3] rounded-2xl bg-primary/5 border border-primary/10 overflow-hidden relative">
                  <div className="absolute inset-0 flex items-center justify-center text-primary/20">
                     <Heart className="w-24 h-24" />
                  </div>
               </div>
               <div className="absolute -bottom-6 -start-6 bg-card p-6 rounded-xl shadow-lg border border-border max-w-[240px] hidden md:block">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <TrendingUp className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{t('home.about.impactTitle')}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t('home.about.impactDesc')}</p>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        </SectionWrapper>

        {/* FEATURED PROJECTS */}
        <SectionWrapper id="featured-projects" variant="default">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">{t('home.sections.featuredProjects')}</h2>
            <p className="text-muted-foreground">{t('projects.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all">
              <div className="aspect-[4/3] bg-primary/10 relative flex items-center justify-center p-6 text-center">
                 <Heart className="w-12 h-12 text-primary mb-4" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display mb-2">{t('projects.feeding')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{t('projects.feedingDesc')}</p>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                  <Link href="/donate?program=feeding">{t('common.donate')}</Link>
                </Button>
              </div>
            </div>
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all">
              <div className="aspect-[4/3] bg-secondary/10 relative flex items-center justify-center p-6 text-center">
                 <Home className="w-12 h-12 text-secondary mb-4" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display mb-2">{t('projects.housing')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{t('projects.housingDesc')}</p>
                <Button variant="outline" className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-colors" asChild>
                  <Link href="/donate?program=housing">{t('common.donate')}</Link>
                </Button>
              </div>
            </div>
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all">
              <div className="aspect-[4/3] bg-info/10 relative flex items-center justify-center p-6 text-center">
                 <GraduationCap className="w-12 h-12 text-info mb-4" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display mb-2">{t('projects.empowerment')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{t('projects.empowermentDesc')}</p>
                <Button variant="outline" className="w-full group-hover:bg-info group-hover:text-info-foreground group-hover:border-info transition-colors" asChild>
                  <Link href="/donate?program=empowerment">{t('common.donate')}</Link>
                </Button>
              </div>
            </div>
          </div>
          <div className="text-center mt-10">
            <Button variant="link" className="font-bold text-primary" asChild>
              <Link href="/projects">
                {t('common.viewAll')} <ArrowIcon className="w-4 h-4 ms-2" />
              </Link>
            </Button>
          </div>
        </SectionWrapper>

        {/* PROGRAMS PREVIEW */}
        <SectionWrapper id="programs" variant="muted">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-display font-bold mb-4">{t('home.sections.programs')}</h2>
              <p className="text-muted-foreground">{t('programs.subtitle')}</p>
            </div>
            <Button variant="outline" className="shrink-0 font-bold" asChild>
              <Link href="/programs">
                {t('common.viewAll')} <ArrowIcon className="w-4 h-4 ms-2" />
              </Link>
            </Button>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {['feeding', 'housing', 'empowerment'].map(id => (
              <div key={id} className="flex flex-col bg-card rounded-2xl border border-border shadow-sm hover-elevate transition-all overflow-hidden group">
                <div className="p-6 md:p-8 flex-1 flex flex-col">
                  <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center mb-6", 
                    id === 'feeding' ? 'text-primary bg-primary/10' : 
                    id === 'housing' ? 'text-secondary bg-secondary/10' : 'text-info bg-info/10')}>
                    {id === 'feeding' ? <Heart className="w-8 h-8" /> : 
                     id === 'housing' ? <Home className="w-8 h-8" /> : <GraduationCap className="w-8 h-8" />}
                  </div>
                  <h3 className="text-2xl font-bold font-display mb-3 text-foreground group-hover:text-primary transition-colors">
                    {t(`programs.items.${id}.title`)}
                  </h3>
                  <p className="text-muted-foreground mb-6 leading-relaxed line-clamp-3">
                    {t(`programs.items.${id}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </SectionWrapper>

        {/* LATEST NEWS & EVENTS GRID */}
        <SectionWrapper id="news-events" variant="default">
           <div className="grid lg:grid-cols-2 gap-12">
              <div>
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold">{t('home.sections.latestNews')}</h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/news">{t('common.viewAll')}</Link>
                    </Button>
                 </div>
                 <div className="space-y-4">
                    {[1, 2].map((i) => (
                       <Link key={i} href="/news" className="flex gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group focus-ring-standard">
                          <div className="w-24 h-24 rounded-xl bg-muted shrink-0 relative overflow-hidden">
                             <div className="absolute inset-0 bg-primary/10"></div>
                          </div>
                          <div className="flex flex-col justify-center">
                             <div className="text-xs text-muted-foreground mb-1">{t(`news.items.${i}.date`)}</div>
                             <h4 className="font-bold group-hover:text-primary transition-colors line-clamp-2">{t(`news.items.${i}.title`)}</h4>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>
              <div>
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold">{t('home.sections.upcomingEvents')}</h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/events">{t('common.viewAll')}</Link>
                    </Button>
                 </div>
                 <div className="space-y-4">
                    {[1, 2].map((i) => (
                       <div key={i} className="flex gap-4 p-4 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group">
                          <div className="w-16 h-16 rounded-xl bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                             <span className="text-xl font-bold font-display leading-none">{t(`events.items.${i}.day`)}</span>
                             <span className="text-xs font-medium">{t(`events.items.${i}.month`)}</span>
                          </div>
                          <div className="flex flex-col justify-center flex-1">
                             <h4 className="font-bold mb-1 group-hover:text-primary transition-colors">{t(`events.items.${i}.title`)}</h4>
                             <div className="text-sm text-muted-foreground flex gap-3">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t(`events.items.${i}.location`)}</span>
                             </div>
                          </div>
                          <div className="flex items-center">
                             <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                               <Link href="/events">{t('home.events.register')}</Link>
                             </Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </SectionWrapper>

        {/* VOLUNTEER CTA */}
        <SectionWrapper id="volunteer-cta" className="relative overflow-hidden border-y border-border" variant="default">
          <div className="absolute inset-0 bg-primary/5"></div>
          <div className="relative z-10 max-w-3xl mx-auto text-center py-12">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-display font-bold mb-4">{t('volunteer.subtitle')}</h2>
            <p className="text-lg text-muted-foreground mb-8">
              {t('common.volunteerDesc')}
            </p>
            <Button size="lg" className="px-8" asChild>
              <Link href="/volunteer">{t('common.volunteerCTA')}</Link>
            </Button>
          </div>
        </SectionWrapper>

        {/* PARTNERS (Redesigned) */}
        <SectionWrapper id="partners" variant="muted">
           <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold">{t('home.sections.partners')}</h2>
           </div>
           <PartnersCarousel items={[1, 2, 3, 4, 5, 6, 7, 8]} t={t} dir={dir} />
        </SectionWrapper>

        {/* FAQ PREVIEW */}
        <SectionWrapper id="faq" variant="default">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">{t('home.sections.faq')}</h2>
              <p className="text-muted-foreground">{t('faq.subtitle')}</p>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => (
                <details key={i} className="group bg-card border border-border rounded-2xl overflow-hidden [&_summary::-webkit-details-marker]:hidden shadow-sm">
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
              ))}
            </div>
            <div className="text-center mt-8">
              <Button variant="link" className="font-bold text-primary text-lg" asChild>
                <Link href="/faq">
                  {t('common.readMore')} <ArrowIcon className="w-5 h-5 ms-2" />
                </Link>
              </Button>
            </div>
          </div>
        </SectionWrapper>

        {/* CONTACT PREVIEW */}
        <SectionWrapper id="contact" variant="muted">
          <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 relative overflow-hidden">
             <div className="absolute top-0 end-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
             <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
               <div className="max-w-2xl text-center lg:text-start lg:rtl:text-right lg:ltr:text-left">
                 <h2 className="text-3xl font-display font-bold mb-4">{t('home.sections.contact')}</h2>
                 <p className="text-lg text-muted-foreground mb-8">{t('common.contactDesc')}</p>
                 <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-6">
                    <div className="flex items-center justify-center sm:justify-start gap-4 bg-card px-6 py-3 rounded-full border border-border shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <Phone className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground ltr-safe block" dir="ltr">+962 6 123 4567</span>
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-4 bg-card px-6 py-3 rounded-full border border-border shadow-sm">
                      <div className="w-10 h-10 rounded-full bg-info/10 text-info flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <span className="font-bold text-foreground ltr-safe block" dir="ltr">info@mujaddidun.org</span>
                    </div>
                 </div>
               </div>
               <div className="w-full lg:w-auto shrink-0 flex justify-center">
                  <Button size="lg" className="w-full sm:w-auto px-10 h-14 text-lg font-bold shadow-lg" asChild>
                    <Link href="/contact">{t('common.send')}</Link>
                  </Button>
               </div>
             </div>
          </div>
        </SectionWrapper>

      </main>
      <Footer />
    </div>
  );
}
