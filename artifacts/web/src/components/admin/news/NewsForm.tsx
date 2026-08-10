import { useEffect, useMemo, useState } from 'react';
import { Eye, Loader2, Save, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import {
  NEWS_CATEGORIES,
  NEWS_EXCERPT_MAX,
  NEWS_TITLE_MAX,
  type NewsArticle,
  type NewsCategorySlug,
  type NewsInput,
  type NewsStatus,
} from '@/services/adminNews';
import { RichTextEditor } from './RichTextEditor';
import { FeaturedImageInput } from './FeaturedImageInput';
import { NewsPreviewDialog } from './NewsPreviewDialog';

export interface NewsFormErrors {
  [field: string]: string;
}

interface NewsFormProps {
  /** Existing article when editing; null when creating. */
  article: NewsArticle | null;
  isSaving: boolean;
  /** Backend validation errors keyed by field name (Laravel format). */
  serverErrors: NewsFormErrors;
  onSubmit: (input: NewsInput) => void;
  onCancel: () => void;
}

interface FormState {
  title_ar: string;
  title_en: string;
  excerpt_ar: string;
  excerpt_en: string;
  content_ar: string;
  content_en: string;
  category: NewsCategorySlug;
  author: string;
  status: NewsStatus;
  published_at: string;
  featured_image: File | null;
  remove_featured_image: boolean;
}

const EMPTY_HTML = /^(<p>\s*<\/p>)*$/;

function isEmptyHtml(html: string): boolean {
  return html.trim() === '' || EMPTY_HTML.test(html.trim());
}

/**
 * Reusable bilingual news form shared by the create and edit pages.
 * "Save as draft" and "Publish" submit the same payload with different
 * statuses; field-level errors merge client validation with Laravel's.
 */
export function NewsForm({
  article,
  isSaving,
  serverErrors,
  onSubmit,
  onCancel,
}: NewsFormProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(() => ({
    title_ar: article?.title_ar ?? '',
    title_en: article?.title_en ?? '',
    excerpt_ar: article?.excerpt_ar ?? '',
    excerpt_en: article?.excerpt_en ?? '',
    content_ar: article?.content_ar ?? '',
    content_en: article?.content_en ?? '',
    category: article?.category ?? 'announcements',
    author: article?.author ?? '',
    status: article?.status ?? 'draft',
    published_at: article?.published_at
      ? article.published_at.slice(0, 10)
      : '',
    featured_image: null,
    remove_featured_image: false,
  }));
  const [clientErrors, setClientErrors] = useState<NewsFormErrors>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  /** Single object URL for the selected file; revoked on replace/unmount. */
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(
    null,
  );

  const replaceSelectedImageUrl = (file: File | null) => {
    setSelectedImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  useEffect(() => {
    return () => {
      setSelectedImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, []);

  const set = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    /** Clear stale validation errors for fields the user is editing. */
    setClientErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const errors = { ...serverErrors, ...clientErrors };

  const validate = (): boolean => {
    const next: NewsFormErrors = {};
    if (!form.title_ar.trim()) next.title_ar = t('admin.news.required');
    if (!form.title_en.trim()) next.title_en = t('admin.news.required');
    if (form.title_ar.length > NEWS_TITLE_MAX)
      next.title_ar = t('admin.news.tooLong', { max: String(NEWS_TITLE_MAX) });
    if (form.title_en.length > NEWS_TITLE_MAX)
      next.title_en = t('admin.news.tooLong', { max: String(NEWS_TITLE_MAX) });
    if (!form.excerpt_ar.trim()) next.excerpt_ar = t('admin.news.required');
    if (!form.excerpt_en.trim()) next.excerpt_en = t('admin.news.required');
    if (form.excerpt_ar.length > NEWS_EXCERPT_MAX)
      next.excerpt_ar = t('admin.news.tooLong', {
        max: String(NEWS_EXCERPT_MAX),
      });
    if (form.excerpt_en.length > NEWS_EXCERPT_MAX)
      next.excerpt_en = t('admin.news.tooLong', {
        max: String(NEWS_EXCERPT_MAX),
      });
    if (isEmptyHtml(form.content_ar))
      next.content_ar = t('admin.news.required');
    if (isEmptyHtml(form.content_en))
      next.content_en = t('admin.news.required');
    if (!form.author.trim()) next.author = t('admin.news.required');
    setClientErrors(next);
    return Object.keys(next).length === 0;
  };

  const buildInput = (status: NewsStatus): NewsInput => ({
    title_ar: form.title_ar.trim(),
    title_en: form.title_en.trim(),
    excerpt_ar: form.excerpt_ar.trim(),
    excerpt_en: form.excerpt_en.trim(),
    content_ar: form.content_ar,
    content_en: form.content_en,
    category: form.category,
    author: form.author.trim(),
    status,
    published_at: form.published_at
      ? new Date(form.published_at).toISOString()
      : null,
    featured_image: form.featured_image,
    remove_featured_image: form.remove_featured_image,
  });

  const submit = (status: NewsStatus) => {
    if (!validate()) return;
    onSubmit(buildInput(status));
  };

  /** Live article assembled from the form for the pre-save preview. */
  const previewArticle = useMemo<NewsArticle>(() => {
    const now = new Date().toISOString();
    return {
      id: article?.id ?? 0,
      ...buildInput(form.status),
      featured_image_url: form.featured_image
        ? selectedImageUrl
        : form.remove_featured_image
          ? null
          : article?.featured_image_url ?? null,
      published_at: form.published_at
        ? new Date(form.published_at).toISOString()
        : article?.published_at ?? null,
      created_at: article?.created_at ?? now,
      updated_at: now,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewOpen]);

  const fieldError = (name: string) =>
    errors[name] ? (
      <p className="text-sm text-destructive" data-testid={`error-${name}`}>
        {errors[name]}
      </p>
    ) : null;

  const bilingualFields = (lang: 'ar' | 'en') => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleKey = `title_${lang}` as const;
    const excerptKey = `excerpt_${lang}` as const;
    const contentKey = `content_${lang}` as const;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`news-title-${lang}`}>
            {t(`admin.news.fields.title_${lang}`)}
          </Label>
          <Input
            id={`news-title-${lang}`}
            dir={dir}
            value={form[titleKey]}
            maxLength={NEWS_TITLE_MAX}
            onChange={(event) => set({ [titleKey]: event.target.value })}
            data-testid={`input-news-title-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[titleKey].length}/{NEWS_TITLE_MAX}
          </p>
          {fieldError(titleKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`news-excerpt-${lang}`}>
            {t(`admin.news.fields.excerpt_${lang}`)}
          </Label>
          <Textarea
            id={`news-excerpt-${lang}`}
            dir={dir}
            rows={3}
            value={form[excerptKey]}
            maxLength={NEWS_EXCERPT_MAX}
            onChange={(event) => set({ [excerptKey]: event.target.value })}
            data-testid={`input-news-excerpt-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[excerptKey].length}/{NEWS_EXCERPT_MAX}
          </p>
          {fieldError(excerptKey)}
        </div>
        <div className="space-y-1.5">
          <Label>{t(`admin.news.fields.content_${lang}`)}</Label>
          <RichTextEditor
            value={form[contentKey]}
            onChange={(html) => set({ [contentKey]: html })}
            dir={dir}
            testId={`editor-news-content-${lang}`}
          />
          {fieldError(contentKey)}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">
              {t('admin.news.contentSection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="ar">
              <TabsList className="mb-4">
                <TabsTrigger value="ar" data-testid="tab-form-ar">
                  العربية
                </TabsTrigger>
                <TabsTrigger value="en" data-testid="tab-form-en">
                  English
                </TabsTrigger>
              </TabsList>
              <TabsContent value="ar">{bilingualFields('ar')}</TabsContent>
              <TabsContent value="en">{bilingualFields('en')}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('admin.news.settingsSection')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>{t('admin.news.columns.category')}</Label>
                <Select
                  value={form.category}
                  onValueChange={(category) =>
                    set({ category: category as NewsCategorySlug })
                  }
                >
                  <SelectTrigger data-testid="select-form-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NEWS_CATEGORIES.map((slug) => (
                      <SelectItem key={slug} value={slug}>
                        {t(`admin.news.categories.${slug}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="news-author">
                  {t('admin.news.columns.author')}
                </Label>
                <Input
                  id="news-author"
                  value={form.author}
                  onChange={(event) => set({ author: event.target.value })}
                  data-testid="input-news-author"
                />
                {fieldError('author')}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="news-published-at">
                  {t('admin.news.columns.publishedAt')}
                </Label>
                <Input
                  id="news-published-at"
                  type="date"
                  value={form.published_at}
                  onChange={(event) =>
                    set({ published_at: event.target.value })
                  }
                  data-testid="input-news-published-at"
                />
                {fieldError('published_at')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {t('admin.news.imageSection')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FeaturedImageInput
                existingUrl={article?.featured_image_url ?? null}
                file={form.featured_image}
                removeExisting={form.remove_featured_image}
                onChange={({ file, removeExisting }) => {
                  replaceSelectedImageUrl(file);
                  set({
                    featured_image: file,
                    remove_featured_image: removeExisting,
                  });
                }}
                error={errors.featured_image}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={isSaving}
          data-testid="button-news-cancel"
        >
          {t('admin.news.cancel')}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreviewOpen(true)}
          disabled={isSaving}
          data-testid="button-news-preview"
        >
          <Eye className="me-1.5 h-4 w-4" />
          {t('admin.news.previewAction')}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => submit('draft')}
          disabled={isSaving}
          data-testid="button-news-save-draft"
        >
          {isSaving ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Save className="me-1.5 h-4 w-4" />
          )}
          {t('admin.news.saveDraft')}
        </Button>
        <Button
          type="button"
          onClick={() => submit('published')}
          disabled={isSaving}
          data-testid="button-news-publish"
        >
          {isSaving ? (
            <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
          ) : (
            <Send className="me-1.5 h-4 w-4" />
          )}
          {t('admin.news.publishAction')}
        </Button>
      </div>

      <NewsPreviewDialog
        article={previewOpen ? previewArticle : null}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}
