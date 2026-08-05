import { Link } from 'wouter';
import { Send, MessageSquareHeart } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';
import { SectionHeading } from '@/components/layout/SectionHeading';

/**
 * Global "Contact Us" panel used across the site.
 * Panel background is intentionally the brand-approved #DCECEB tint
 * (no muted #EBF4F1 wrapper behind it).
 */
export function ContactPanel() {
  const { t } = useLocale();

  return (
    <div
      className="group max-w-4xl mx-auto rounded-2xl bg-[#DCECEB] border border-primary/10 p-3 md:p-4 relative overflow-hidden shadow-sm transition-shadow hover:shadow-md"
      data-testid="panel-contact-us"
    >
      {/* Decorative accents — subtle, clipped, non-interactive */}
      <div className="absolute top-0 end-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none translate-x-1/3 -translate-y-1/2 transition-transform duration-700 group-hover:translate-x-1/4"></div>
      <div className="absolute bottom-0 start-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none -translate-x-1/3 translate-y-1/2"></div>

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-3 md:gap-5 text-center md:text-start">
        <div className="hidden md:flex w-11 h-11 rounded-xl bg-primary/10 text-primary items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110">
          <MessageSquareHeart className="w-6 h-6" aria-hidden="true" />
        </div>
        <div className="flex-1 flex flex-col md:flex-row md:items-center gap-1.5 md:gap-4 min-w-0">
          <SectionHeading
            title={t('home.sections.contact')}
            align="start"
            accent="secondary"
            size="md"
            className="mb-0 shrink-0 [&>div]:max-w-none"
          />
          <p className="text-muted-foreground text-sm truncate md:whitespace-normal">
            {t('common.contactDesc')}
          </p>
        </div>
        <div className="w-full md:w-auto shrink-0 flex justify-center">
          <Button
            size="lg"
            className="w-full md:w-auto px-6 h-10 text-base font-bold shadow-md transition-transform hover:scale-[1.03]"
            asChild
            data-testid="button-contact-panel-send"
          >
            <Link href="/contact">
              <Send className="w-4 h-4 me-2" aria-hidden="true" />
              {t('common.send')}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
