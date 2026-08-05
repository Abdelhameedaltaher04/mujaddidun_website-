import { Link } from 'wouter';
import { ArrowLeft, ArrowRight, Zap, MessagesSquare, Clock, MessageSquareHeart } from 'lucide-react';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Premium "Contact Us" CTA panel used across the site.
 * Background is exclusively the brand-approved #DCECEB tint — no muted
 * (#EBF4F1) wrapper may sit behind it.
 */
export function ContactPanel() {
  const { t, dir } = useLocale();
  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const highlights = [
    { icon: Zap, label: t('common.contactHighlightFast'), color: 'text-secondary bg-secondary/10' },
    { icon: MessagesSquare, label: t('common.contactHighlightConsult'), color: 'text-primary bg-primary/10' },
    { icon: Clock, label: t('common.contactHighlight247'), color: 'text-info bg-info/10' },
  ];

  return (
    <div
      className="group relative max-w-5xl mx-auto overflow-hidden rounded-[20px] bg-[#DCECEB] border border-[rgba(255,255,255,0.45)] shadow-[0_12px_35px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(0,0,0,0.12)] p-6 md:p-7"
      data-testid="panel-contact-us"
    >
      {/* Corner radial highlight for depth */}
      <div
        className="absolute -top-24 -end-24 w-72 h-72 rounded-full pointer-events-none opacity-70"
        style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0) 65%)' }}
        aria-hidden="true"
      ></div>
      <div className="absolute bottom-0 start-0 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" aria-hidden="true"></div>

      <div className="relative z-10 grid gap-6 lg:grid-cols-[1.1fr_1.2fr_auto] lg:items-center text-center lg:text-start">
        {/* Left — identity */}
        <div className="flex flex-col items-center lg:items-start gap-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full shrink-0 flex items-center justify-center text-white shadow-lg shadow-primary/25 bg-gradient-to-br from-primary to-primary/70 transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
              <MessageSquareHeart className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <span className="block w-10 h-1 rounded-full bg-gradient-to-r from-secondary to-primary mb-2 mx-auto lg:mx-0" aria-hidden="true"></span>
              <h2 className="text-xl md:text-2xl font-display font-bold text-foreground leading-tight">
                {t('home.sections.contact')}
              </h2>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {t('common.contactDesc')}
          </p>
        </div>

        {/* Center — quick highlights */}
        <ul className="flex flex-wrap justify-center lg:justify-start gap-2.5 list-none m-0 p-0">
          {highlights.map(({ icon: Icon, label, color }) => (
            <li
              key={label}
              className="flex items-center gap-2 rounded-full bg-white/60 border border-white/70 backdrop-blur-sm px-3.5 py-2 text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:bg-white/90 hover:shadow-md"
            >
              <span className={`flex w-6 h-6 items-center justify-center rounded-full shrink-0 ${color} transition-transform duration-300 hover:scale-110`}>
                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
              </span>
              {label}
            </li>
          ))}
        </ul>

        {/* Right — primary CTA */}
        <div className="flex justify-center lg:justify-end">
          <Link
            href="/contact"
            className="group/cta inline-flex w-full lg:w-auto items-center justify-center gap-2.5 rounded-[13px] px-7 py-3.5 text-base font-bold text-white bg-gradient-to-br from-primary via-primary to-[#005a80] shadow-[0_8px_24px_rgba(0,113,160,0.35)] transition-all duration-300 hover:scale-[1.04] hover:shadow-[0_12px_30px_rgba(0,113,160,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            data-testid="button-contact-panel-send"
          >
            {t('common.send')}
            <ArrowIcon
              className="w-5 h-5 transition-transform duration-300 ltr:group-hover/cta:translate-x-1 rtl:group-hover/cta:-translate-x-1"
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </div>
  );
}
