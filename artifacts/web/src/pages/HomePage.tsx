import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Heart, Home, GraduationCap, ArrowLeft, ArrowRight, Users, CheckCircle2, TrendingUp } from 'lucide-react';

export default function HomePage() {
  const { t, dir } = useLocale();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-primary text-primary-foreground">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?q=80&w=2940&auto=format&fit=crop')] bg-cover bg-center opacity-10 mix-blend-overlay pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-primary to-primary/80"></div>
          
          <div className="container-wide relative z-10 py-20 lg:py-32 flex flex-col items-center text-center">
            <span className="inline-flex items-center rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-3 py-1 text-sm font-medium backdrop-blur-sm mb-6">
              {t('app.name')}
            </span>
            <h1 className="text-4xl lg:text-6xl font-display font-bold max-w-4xl tracking-tight text-balance mb-6">
              {t('projects.subtitle')}
            </h1>
            <p className="text-lg lg:text-xl max-w-2xl text-primary-foreground/80 mb-10 text-balance">
              {t('about.visionText')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Button size="lg" variant="secondary" className="px-8 font-bold" asChild>
                <Link href="/projects">{t('common.donate')}</Link>
              </Button>
              <Button size="lg" variant="outline" className="px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10" asChild>
                <Link href="/about">{t('about.story')}</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* STATISTICS SECTION */}
        <SectionWrapper id="statistics" className="py-8 md:py-12 -mt-8 relative z-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 bg-card rounded-2xl shadow-xl border border-border p-6 md:p-8">
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-display font-bold text-primary">10+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.years')}</div>
             </div>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-display font-bold text-secondary">50k+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.beneficiaries')}</div>
             </div>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-display font-bold text-primary">500+</div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">{t('home.stats.volunteers')}</div>
             </div>
             <div className="text-center space-y-2">
                <div className="text-3xl md:text-4xl font-display font-bold text-secondary">20+</div>
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
                  {/* Image placeholder */}
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
        <SectionWrapper id="featured-projects">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-display font-bold mb-4">{t('home.sections.featuredProjects')}</h2>
            <p className="text-muted-foreground">{t('projects.subtitle')}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Project 1 */}
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all">
              <div className="aspect-[4/3] bg-primary/10 relative flex items-center justify-center p-6 text-center">
                 <Heart className="w-12 h-12 text-primary mb-4" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display mb-2">{t('projects.feeding')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{t('projects.feedingDesc')}</p>
                <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors" asChild>
                  <Link href="/projects#feeding">{t('common.donate')}</Link>
                </Button>
              </div>
            </div>
            {/* Project 2 */}
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all">
              <div className="aspect-[4/3] bg-secondary/10 relative flex items-center justify-center p-6 text-center">
                 <Home className="w-12 h-12 text-secondary mb-4" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display mb-2">{t('projects.housing')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{t('projects.housingDesc')}</p>
                <Button variant="outline" className="w-full group-hover:bg-secondary group-hover:text-secondary-foreground group-hover:border-secondary transition-colors" asChild>
                  <Link href="/projects#housing">{t('common.donate')}</Link>
                </Button>
              </div>
            </div>
            {/* Project 3 */}
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all">
              <div className="aspect-[4/3] bg-info/10 relative flex items-center justify-center p-6 text-center">
                 <GraduationCap className="w-12 h-12 text-info mb-4" />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display mb-2">{t('projects.empowerment')}</h3>
                <p className="text-muted-foreground mb-6 line-clamp-2">{t('projects.empowermentDesc')}</p>
                <Button variant="outline" className="w-full group-hover:bg-info group-hover:text-info-foreground group-hover:border-info transition-colors" asChild>
                  <Link href="/projects#empowerment">{t('common.donate')}</Link>
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

        {/* LATEST NEWS & EVENTS GRID */}
        <SectionWrapper id="news-events" variant="muted">
           <div className="grid lg:grid-cols-2 gap-12">
              {/* News */}
              <div>
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold">{t('home.sections.latestNews')}</h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/news">{t('common.viewAll')}</Link>
                    </Button>
                 </div>
                 <div className="space-y-4">
                    {[1, 2].map((i) => (
                       <Link key={i} href="/news" className="flex gap-4 p-4 rounded-xl border border-border bg-card hover-elevate transition-all group">
                          <div className="w-24 h-24 rounded-lg bg-muted shrink-0"></div>
                          <div className="flex flex-col justify-center">
                             <div className="text-xs text-muted-foreground mb-1">{t('home.news.sampleDate')}</div>
                             <h4 className="font-bold group-hover:text-primary transition-colors line-clamp-2">{t('home.news.sampleTitle')}</h4>
                          </div>
                       </Link>
                    ))}
                 </div>
              </div>
              {/* Events */}
              <div>
                 <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-display font-bold">{t('home.sections.upcomingEvents')}</h2>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href="/events">{t('common.viewAll')}</Link>
                    </Button>
                 </div>
                 <div className="space-y-4">
                    {[1, 2].map((i) => (
                       <div key={i} className="flex gap-4 p-4 rounded-xl border border-border bg-card">
                          <div className="w-16 h-16 rounded-lg bg-primary/10 flex flex-col items-center justify-center shrink-0 text-primary">
                             <span className="text-xl font-bold font-display leading-none">{t('home.events.sampleDay')}</span>
                             <span className="text-xs font-medium">{t('home.events.sampleMonth')}</span>
                          </div>
                          <div className="flex flex-col justify-center flex-1">
                             <h4 className="font-bold mb-1">{t('home.events.sampleTitle')}</h4>
                             <div className="text-sm text-muted-foreground flex gap-3">
                                <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {t('home.events.location')}</span>
                             </div>
                          </div>
                          <div className="flex items-center">
                             <Button variant="outline" size="sm" asChild><Link href="/events">{t('home.events.register')}</Link></Button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>
        </SectionWrapper>

        {/* VOLUNTEER CTA */}
        <SectionWrapper id="volunteer-cta" className="relative overflow-hidden border-y border-border">
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

        {/* PARTNERS (Simplified) */}
        <SectionWrapper id="partners">
           <div className="text-center mb-10">
              <h2 className="text-2xl font-display font-bold">{t('home.sections.partners')}</h2>
           </div>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
              {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="font-display font-bold text-xl text-muted-foreground">{t('home.partners.partner')} {i}</div>
              ))}
           </div>
        </SectionWrapper>

      </main>
      <Footer />
    </div>
  );
}
