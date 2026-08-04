import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { SectionHeading } from '@/components/layout/SectionHeading';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { Heart, Home, GraduationCap, ArrowLeft, ArrowRight } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

export default function AboutPage() {
  const { t, dir } = useLocale();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('about.title')} 
        description={t('about.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('about.title') }]}
      />
      <main className="flex-1">
        <SectionWrapper id="about">
          <div className="max-w-3xl mx-auto text-center">
            <h2
              className="text-3xl font-display font-bold text-foreground mb-8"
              data-testid="text-about-heading"
            >
              {t('about.heading')}
            </h2>
            <div className="space-y-6 text-start">
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('about.descriptionP1')}
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('about.descriptionP2')}
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                {t('about.descriptionP3')}
              </p>
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper id="mission-vision" variant="muted">
          <div className="grid gap-8 md:grid-cols-2">
            <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover-elevate">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">{t('about.mission')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('about.missionText')}</p>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-border shadow-sm hover-elevate">
              <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-display font-bold mb-4">{t('about.vision')}</h3>
              <p className="text-muted-foreground leading-relaxed">{t('about.visionText')}</p>
            </div>
          </div>
        </SectionWrapper>

        <SectionWrapper id="projects" variant="muted">
          <SectionHeading
            title={t('projects.title')}
            description={t('projects.subtitle')}
            accent="primary"
          />
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all" data-testid="card-about-project-feeding">
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
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all" data-testid="card-about-project-housing">
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
            <div className="group rounded-2xl overflow-hidden border border-border bg-card hover-elevate transition-all" data-testid="card-about-project-empowerment">
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

        <SectionWrapper id="values">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-display font-bold text-foreground mb-4">{t('about.values')}</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div
                key={num}
                className="p-8 rounded-2xl border border-border bg-card shadow-sm text-center hover-elevate-2 transition-all"
                data-testid={`card-value-${num}`}
              >
                <div className="h-10 w-10 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <span className="h-2.5 w-2.5 rounded-full bg-primary" aria-hidden="true" />
                </div>
                <p className="text-lg font-semibold text-foreground">{t(`about.value${num}`)}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
