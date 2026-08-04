import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';

/**
 * Switches between Arabic and English. Shows the language you would
 * switch TO, which is the common convention for bilingual sites.
 */
export function LanguageToggle() {
  const { locale, toggleLocale, t } = useLocale();
  const targetLabel =
    locale === 'ar' ? t('common.english') : t('common.arabic');

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLocale}
      aria-label={t('common.language')}
      data-testid="button-language-toggle"
    >
      {targetLabel}
    </Button>
  );
}
