import { Mail, MessageCircle } from 'lucide-react';
import { FaWhatsapp } from 'react-icons/fa6';
import { Link } from 'wouter';
import { useLocale } from '@/contexts/LocaleContext';
import { Button } from '@/components/ui/button';

const WHATSAPP_NUMBER = '96261234567';
const CONTACT_EMAIL = 'info@mujaddidun.org';

export function FormContactHelp() {
  const { t } = useLocale();

  return (
    <aside
      className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start"
      aria-label={t('common.formHelpTitle')}
      data-testid="form-contact-help"
    >
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground sm:justify-start">
        <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
        <span>{t('common.formHelpTitle')}</span>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button
          asChild
          size="sm"
          variant="outline"
          className="h-9 rounded-full px-3 transition-transform hover:scale-105"
          data-testid="button-form-help-contact"
        >
          <Link href="/contact">{t('common.formHelpContact')}</Link>
        </Button>
        <Button
          asChild
          size="sm"
          className="h-9 rounded-full bg-[#25D366] px-3 text-white transition-transform hover:scale-105 hover:bg-[#20bd5a]"
          data-testid="button-form-help-whatsapp"
        >
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaWhatsapp className="me-1.5 h-4 w-4" aria-hidden="true" />
            {t('common.formHelpWhatsapp')}
          </a>
        </Button>
        <Button
          asChild
          size="sm"
          variant="ghost"
          className="h-9 rounded-full px-3 text-primary transition-transform hover:scale-105 hover:bg-primary/10"
          data-testid="button-form-help-email"
        >
          <a href={`mailto:${CONTACT_EMAIL}`}>
            <Mail className="me-1.5 h-4 w-4" aria-hidden="true" />
            {t('common.formHelpEmail')}
          </a>
        </Button>
      </div>
    </aside>
  );
}