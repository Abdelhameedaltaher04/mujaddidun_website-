import { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { PageHeader } from '@/components/layout/PageHeader';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { Heart, Home, GraduationCap, Users, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'wouter';

type Category = 'all' | 'humanitarian' | 'development' | 'seasonal';

export default function ProgramsPage() {
  const { t } = useLocale();
  const [filter, setFilter] = useState<Category>('all');

  const categories: { id: Category; label: string }[] = [
    { id: 'all', label: t('programs.filter.all') },
    { id: 'humanitarian', label: t('programs.filter.humanitarian') },
    { id: 'development', label: t('programs.filter.development') },
    { id: 'seasonal', label: t('programs.filter.seasonal') }
  ];

  const programs = [
    {
      id: 'feeding',
      category: 'humanitarian',
      icon: Heart,
      iconClass: 'text-primary bg-primary/10',
    },
    {
      id: 'housing',
      category: 'humanitarian', // can be developmental too, but keeping single cat for simplicity
      icon: Home,
      iconClass: 'text-secondary bg-secondary/10',
    },
    {
      id: 'empowerment',
      category: 'development',
      icon: GraduationCap,
      iconClass: 'text-info bg-info/10',
    },
    {
      id: 'volunteerism',
      category: 'development',
      icon: Users,
      iconClass: 'text-warning bg-warning/10',
    },
    {
      id: 'seasonal',
      category: 'seasonal',
      icon: Calendar,
      iconClass: 'text-success bg-success/10',
    }
  ];

  const filteredPrograms = filter === 'all' 
    ? programs 
    : programs.filter(p => p.category === filter);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <PageHeader 
        title={t('programs.title')} 
        description={t('programs.subtitle')}
        breadcrumbs={[
          { label: t('nav.home'), href: '/' }, 
          { label: t('programs.title') }
        ]}
      />
      <main className="flex-1">
        <SectionWrapper>
          <div className="flex flex-wrap justify-center gap-2 mb-12" role="group" aria-label={t('programs.aria.filterGroup')}>
            {categories.map(cat => (
              <Button
                key={cat.id}
                variant={filter === cat.id ? 'default' : 'outline'}
                onClick={() => setFilter(cat.id)}
                aria-pressed={filter === cat.id}
                className="rounded-full px-6"
              >
                {cat.label}
              </Button>
            ))}
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {filteredPrograms.map(p => {
              const Icon = p.icon;
              return (
                <div key={p.id} className="flex flex-col bg-card rounded-2xl border border-border shadow-sm hover-elevate transition-all overflow-hidden group">
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <div className={cn("w-16 h-16 rounded-xl flex items-center justify-center mb-6", p.iconClass)}>
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-2xl font-bold font-display mb-3 text-foreground group-hover:text-primary transition-colors">
                      {t(`programs.items.${p.id}.title`)}
                    </h3>
                    <p className="text-muted-foreground mb-6 leading-relaxed flex-1">
                      {t(`programs.items.${p.id}.desc`)}
                    </p>
                    
                    <div className="space-y-4 border-t border-border pt-4 mt-auto">
                      <div>
                        <strong className="block text-sm text-foreground mb-1">{t('programs.labels.activities')}</strong>
                        <span className="text-sm text-muted-foreground">{t(`programs.items.${p.id}.activities`)}</span>
                      </div>
                      <div>
                        <strong className="block text-sm text-foreground mb-1">{t('programs.labels.impact')}</strong>
                        <span className="text-sm font-medium text-primary bg-primary/5 inline-block px-2 py-1 rounded">
                          {t(`programs.items.${p.id}.stats`)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="px-6 pb-6 pt-2">
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
