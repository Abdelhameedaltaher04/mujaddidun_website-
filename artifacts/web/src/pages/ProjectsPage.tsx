import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { cn } from '@/lib/utils';

import { Heart, Home, GraduationCap } from 'lucide-react';

export default function ProjectsPage() {
  const { t } = useLocale();

  const projects = [
    { id: 'feeding', icon: Heart, bgClass: 'bg-primary/10', textClass: 'text-primary', borderClass: 'border-primary' },
    { id: 'housing', icon: Home, bgClass: 'bg-secondary/10', textClass: 'text-secondary', borderClass: 'border-secondary' },
    { id: 'empowerment', icon: GraduationCap, bgClass: 'bg-info/10', textClass: 'text-info', borderClass: 'border-info' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('projects.title')} 
        description={t('projects.subtitle')}
        breadcrumbs={[{ label: t('nav.home'), href: '/' }, { label: t('projects.title') }]}
      />
      <main className="flex-1 py-8">
        <SectionWrapper>
          <div className="grid gap-8 md:grid-cols-3">
            {projects.map((p) => {
              const Icon = p.icon;
              return (
              <div key={p.id} className="flex flex-col rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover-elevate transition-all group">
                <div className={cn("aspect-video relative flex items-center justify-center p-6", p.bgClass)}>
                   <Icon className={cn("w-16 h-16 mb-2", p.textClass)} />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-2xl font-display font-bold mb-3 group-hover:text-primary transition-colors">{t(`projects.${p.id}`)}</h3>
                  <p className="text-muted-foreground leading-relaxed mb-6 flex-1">{t(`projects.${p.id}Desc`)}</p>
                  <Button asChild className="w-full" variant="outline">
                    <Link href={`/donate?program=${p.id}`}>{t('common.donate')}</Link>
                  </Button>
                </div>
              </div>
              );
            })}
          </div>
        </SectionWrapper>
      </main>
      <Footer />
    </div>
  );
}
