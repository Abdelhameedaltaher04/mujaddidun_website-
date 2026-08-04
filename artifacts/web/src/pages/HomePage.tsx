import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { SectionWrapper } from '@/components/layout/SectionWrapper';
import { useLocale } from '@/contexts/LocaleContext';

/** Homepage section skeleton: id + translation key, in display order. */
const HOME_SECTIONS = [
  { id: 'hero', key: 'home.sections.hero' },
  { id: 'statistics', key: 'home.sections.statistics' },
  { id: 'about-preview', key: 'home.sections.aboutPreview' },
  { id: 'featured-projects', key: 'home.sections.featuredProjects' },
  { id: 'latest-news', key: 'home.sections.latestNews' },
  { id: 'upcoming-events', key: 'home.sections.upcomingEvents' },
  { id: 'partners', key: 'home.sections.partners' },
  { id: 'success-stories', key: 'home.sections.successStories' },
  { id: 'volunteer-cta', key: 'home.sections.volunteerCta' },
] as const;

/**
 * Homepage structure only — each section is an empty placeholder
 * containing just its title. Section content comes in later phases.
 */
export default function HomePage() {
  const { t } = useLocale();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">
        {HOME_SECTIONS.map((section, index) => (
          <SectionWrapper
            key={section.id}
            id={section.id}
            variant={index % 2 === 1 ? 'muted' : 'default'}
            data-testid={`section-${section.id}`}
          >
            <h2 className="text-2xl font-bold text-foreground">{t(section.key)}</h2>
          </SectionWrapper>
        ))}
      </main>
      <Footer />
    </div>
  );
}
