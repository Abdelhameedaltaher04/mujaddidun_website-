import { ContactPanel } from '@/components/layout/ContactPanel';
import { SectionWrapper } from '@/components/layout/SectionWrapper';

interface ContactCtaSectionProps {
  id?: string;
}

/**
 * Shared page-level contact CTA.
 *
 * Keeping the section wrapper here ensures every public page gets the same
 * spacing and the same premium CTA without duplicating layout markup.
 */
export function ContactCtaSection({ id }: ContactCtaSectionProps) {
  return (
    <SectionWrapper
      id={id}
      variant="default"
      className="py-8 md:py-10"
      data-testid="section-contact-cta"
    >
      <ContactPanel />
    </SectionWrapper>
  );
}