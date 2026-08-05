import { Navbar } from '@/components/layout/Navbar';
import { useState } from 'react';
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
import { cn } from '@/lib/utils';
import logoUrl from '@/assets/mujaddidun-logo.png';


export default function HomePage() {
  const { t, dir } = useLocale();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;
  const [faqExpanded, setFaqExpanded] = useState(false);

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
              <Button size="lg" variant="secondary" className="px-10 h-14 text-lg font-bold shadow-[0_0_40px_-10px_rgba(255,88,16,0.6)] transition-all hover:scale-105 hover-elevate-2" asChild>
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
        <SectionWrapper id="statistics" className="pt-8 pb-12 md:pt-12 md:pb-16 -mt-16 relative z-20">
          <SectionHeading
            kicker={t('home.sections.statistics')}
            title={t('common.ourImpact')}
            size="md"
            accent="secondary"
            className="mb-6 lg:mb-8"
          />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8 animate-hero-up" style={{ animationDelay: '0.6s' }}>
             <StatCounter target={10} suffix="+" label={t('home.stats.years')} duration={1400} colorClass="text-primary" />
             <StatCounter target={50} suffix="k+" label={t('home.stats.beneficiaries')} duration={2200} colorClass="text-secondary" />
             <StatCounter target={500} suffix="+" label={t('home.stats.volunteers')} duration={1900} colorClass="text-primary" />
             <StatCounter target={20} suffix="+" label={t('home.stats.projects')} duration={1650} colorClass="text-secondary" />
          </div>
        </SectionWrapper>

        {/* ABOUT + FEATURED PROJECTS — ONE NARRATIVE ARC */}
        <SectionWrapper id="about" variant="muted">
          <SectionHeading
            kicker={t('about.story')}
            title={t('about.title')}
            accent="primary"
          />

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground leading-relaxed">
                {t('about.storyText')}
              </p>

              <blockquote className="border-s-4 border-secondary ps-5 py-1">
                <p className="text-foreground font-medium leading-relaxed italic">
                  {t('about.missionText')}
                </p>
                <span className="block text-sm font-bold text-secondary mt-2">
                  {t('about.mission')}
                </span>
              </blockquote>

              <blockquote className="border-s-4 border-primary ps-5 py-1">
                <p className="text-foreground font-medium leading-relaxed italic">
                  {t('about.visionText')}
                </p>
                <span className="block text-sm font-bold text-primary mt-2">
                  {t('about.vision')}
                </span>
              </blockquote>

              <Button variant="link" className="p-0 h-auto text-primary font-bold group" asChild>
                <Link href="/about">
                  {t('common.readMore')} <ArrowIcon className="w-4 h-4 ms-2 group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
             <div className="relative order-first lg:order-none w-full">
                <div className="aspect-[7/5] rounded-3xl bg-primary/5 border border-primary/10 overflow-hidden shadow-xl shadow-primary/10">
                  <img
                    src={logoUrl}
                    alt={t('app.name')}
                    className="h-full w-full object-cover object-center"
                    data-testid="img-about-logo"
                  />
               </div>
            </div>
          </div>

        </SectionWrapper>

        {/* PROGRAMS PREVIEW */}
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
                    {[1, 2].map((i) => (
                       <div key={i} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group h-full items-start sm:items-center">
                          <div className="w-24 h-24 rounded-xl bg-muted shrink-0 relative overflow-hidden flex items-center justify-center">
                             <div className="absolute inset-0 bg-primary/10"></div>
                          </div>
                          <div className="flex flex-col justify-center flex-1">
                             <div className="text-sm font-medium text-primary mb-2">{t(`news.items.${i}.date`)}</div>
                             <h4 className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{t(`news.items.${i}.title`)}</h4>
                          </div>
                          <div className="flex items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                             <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                               <Link href={`/news/${i}`}>{t('common.readMore')}</Link>
                             </Button>
                          </div>
                       </div>
                    ))}
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
                    {[1, 2].map((i) => (
                       <div key={i} className="flex flex-col sm:flex-row gap-5 p-5 rounded-2xl border border-border bg-card shadow-sm hover-elevate transition-all group h-full items-start sm:items-center">
                          <div className="w-24 h-24 rounded-xl bg-secondary/10 flex flex-col items-center justify-center shrink-0 text-secondary">
                             <span className="text-2xl font-bold font-display leading-none mb-1">{t(`events.items.${i}.day`)}</span>
                             <span className="text-sm font-medium uppercase tracking-wider">{t(`events.items.${i}.month`)}</span>
                          </div>
                          <div className="flex flex-col justify-center flex-1">
                             <div className="text-sm font-medium text-secondary mb-2 flex items-center gap-1">
                                <MapPin className="w-4 h-4 shrink-0" /> {t(`events.items.${i}.location`)}
                             </div>
                             <h4 className="font-bold text-foreground group-hover:text-secondary transition-colors line-clamp-2">{t(`events.items.${i}.title`)}</h4>
                          </div>
                          <div className="flex items-center shrink-0 w-full sm:w-auto mt-2 sm:mt-0">
                             <Button variant="outline" size="sm" className="w-full sm:w-auto group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-colors" asChild>
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
          <div className="relative z-10 max-w-4xl mx-auto text-center py-12 md:py-16">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
              <Users className="w-8 h-8" />
            </div>
            <SectionHeading
              kicker={t('home.sections.volunteerCta')}
              title={t('volunteer.subtitle')}
              description={t('common.volunteerDesc')}
              accent="secondary"
              className="mb-8 lg:mb-10 max-w-none mx-auto [&>div]:max-w-none"
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

        {/* PARTNERS (Redesigned) */}
        <section id="partners" className="relative w-[100vw] overflow-hidden bg-muted py-12 md:py-16">
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

        {/* FAQ PREVIEW */}
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

        {/* CONTACT PREVIEW */}
        <SectionWrapper id="contact" variant="muted">
           <div className="bg-primary/5 rounded-3xl p-8 md:p-12 border border-primary/10 relative overflow-hidden">
             <div className="absolute top-0 end-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>
              <div className="relative z-10 flex flex-col items-center gap-6 text-center">
                 <SectionHeading
                   title={t('home.sections.contact')}
                   description={t('common.contactDesc')}
                    align="center"
                    accent="secondary"
                    className="mb-2"
                 />
                <div className="w-full sm:w-auto shrink-0 flex justify-center">
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
