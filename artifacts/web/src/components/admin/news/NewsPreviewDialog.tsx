import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLocale } from '@/contexts/LocaleContext';
import type { NewsArticle } from '@/services/adminNews';
import { NewsStatusBadge } from './NewsTable';

interface NewsPreviewDialogProps {
  article: NewsArticle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full article preview rendered the way the public site will display it,
 * switchable between the Arabic and English versions.
 */
export function NewsPreviewDialog({
  article,
  open,
  onOpenChange,
}: NewsPreviewDialogProps) {
  const { t, locale } = useLocale();
  const [lang, setLang] = useState<'ar' | 'en'>(locale === 'ar' ? 'ar' : 'en');

  if (!article) return null;

  const isAr = lang === 'ar';
  const title = isAr ? article.title_ar : article.title_en;
  const excerpt = isAr ? article.excerpt_ar : article.excerpt_en;
  const content = isAr ? article.content_ar : article.content_en;
  const dateFormatter = new Intl.DateTimeFormat(isAr ? 'ar-JO' : 'en-US', {
    dateStyle: 'long',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? 'rtl' : 'ltr'}
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-testid="dialog-news-preview"
      >
        <DialogHeader>
          <div className="flex flex-wrap items-center justify-between gap-2 pe-6">
            <DialogTitle>{t('admin.news.previewTitle')}</DialogTitle>
            <Tabs
              value={lang}
              onValueChange={(value) => setLang(value as 'ar' | 'en')}
            >
              <TabsList className="h-8">
                <TabsTrigger value="ar" className="text-xs" data-testid="tab-preview-ar">
                  العربية
                </TabsTrigger>
                <TabsTrigger value="en" className="text-xs" data-testid="tab-preview-en">
                  English
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <DialogDescription className="sr-only">
            {t('admin.news.previewTitle')}
          </DialogDescription>
        </DialogHeader>

        <article dir={isAr ? 'rtl' : 'ltr'} className="space-y-4">
          {article.featured_image_url ? (
            <img
              src={article.featured_image_url}
              alt=""
              className="max-h-72 w-full rounded-lg border border-border object-cover"
            />
          ) : null}
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <NewsStatusBadge status={article.status} />
            <span>{t(`admin.news.categories.${article.category}`)}</span>
            <span>·</span>
            <span>{article.author}</span>
            {article.published_at ? (
              <>
                <span>·</span>
                <span>{dateFormatter.format(new Date(article.published_at))}</span>
              </>
            ) : null}
          </div>
          <h1
            className="text-2xl font-bold leading-snug text-foreground"
            data-testid="text-preview-title"
          >
            {title}
          </h1>
          {excerpt ? (
            <p className="text-base leading-relaxed text-muted-foreground">
              {excerpt}
            </p>
          ) : null}
          <div
            className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground/90"
            // Content is authored in the trusted admin rich text editor and
            // will be server-sanitized once the Laravel API stores it.
            dangerouslySetInnerHTML={{ __html: content }}
            data-testid="content-preview-body"
          />
        </article>
      </DialogContent>
    </Dialog>
  );
}
