import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import type { Faq } from '@/services/adminFaqs';

interface FaqPreviewDialogProps {
  faq: Faq | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Previews how the FAQ appears on the public FAQ page: same card +
 * accordion styling (open/close animation included), switchable AR/EN.
 */
export function FaqPreviewDialog({
  faq,
  open,
  onOpenChange,
}: FaqPreviewDialogProps) {
  const { t, dir } = useLocale();
  const [lang, setLang] = useState<'ar' | 'en'>(dir === 'rtl' ? 'ar' : 'en');

  if (!faq) return null;
  const question = lang === 'ar' ? faq.question_ar : faq.question_en;
  const answer = lang === 'ar' ? faq.answer_ar : faq.answer_en;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[85vh] overflow-y-auto sm:max-w-xl"
        data-testid="dialog-faq-preview"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.faqs.previewTitle')}</DialogTitle>
          <DialogDescription>
            {t('admin.faqs.previewDescription')}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={lang}
          onValueChange={(value) => setLang(value as 'ar' | 'en')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ar" data-testid="tab-faq-preview-ar">
              {t('admin.faqs.arabicTab')}
            </TabsTrigger>
            <TabsTrigger value="en" data-testid="tab-faq-preview-en">
              {t('admin.faqs.englishTab')}
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Replica of the public FAQ page card (FaqPage.tsx) */}
        <div
          dir={lang === 'ar' ? 'rtl' : 'ltr'}
          className="rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8"
        >
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="preview" className="border-border">
              <AccordionTrigger className="text-lg font-medium text-start hover:text-primary transition-colors focus-ring-standard rounded-md">
                {question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground leading-relaxed text-base pt-2 whitespace-pre-line">
                {answer}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </DialogContent>
    </Dialog>
  );
}
