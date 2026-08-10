import { useEffect, useState } from 'react';
import { Loader2, Save, Send } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/contexts/LocaleContext';
import { FeaturedImageInput } from '@/components/admin/news/FeaturedImageInput';
import {
  ALBUM_DESCRIPTION_MAX,
  ALBUM_TITLE_MAX,
  type AlbumInput,
  type AlbumStatus,
  type GalleryAlbum,
} from '@/services/adminGallery';

export interface AlbumFormErrors {
  [field: string]: string;
}

interface AlbumFormDialogProps {
  /** Existing album when editing; null when creating. */
  album: GalleryAlbum | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  serverErrors: AlbumFormErrors;
  onSubmit: (input: AlbumInput) => void;
}

interface FormState {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  cover_image: File | null;
  remove_cover: boolean;
}

const emptyState = (album: GalleryAlbum | null): FormState => ({
  title_ar: album?.title_ar ?? '',
  title_en: album?.title_en ?? '',
  description_ar: album?.description_ar ?? '',
  description_en: album?.description_en ?? '',
  cover_image: null,
  remove_cover: false,
});

/** Create / edit an album: bilingual tabs + cover image + draft/publish. */
export function AlbumFormDialog({
  album,
  open,
  onOpenChange,
  isSaving,
  serverErrors,
  onSubmit,
}: AlbumFormDialogProps) {
  const { t } = useLocale();
  const [form, setForm] = useState<FormState>(() => emptyState(album));
  const [clientErrors, setClientErrors] = useState<AlbumFormErrors>({});

  /** Re-seed whenever the dialog opens for a different album / create. */
  useEffect(() => {
    if (open) {
      setForm(emptyState(album));
      setClientErrors({});
    }
  }, [open, album]);

  const set = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setClientErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const errors = { ...serverErrors, ...clientErrors };

  const validate = (): boolean => {
    const next: AlbumFormErrors = {};
    const required = t('admin.gallery.required');
    if (!form.title_ar.trim()) next.title_ar = required;
    if (!form.title_en.trim()) next.title_en = required;
    for (const key of ['title_ar', 'title_en'] as const) {
      if (form[key].length > ALBUM_TITLE_MAX)
        next[key] = t('admin.gallery.tooLong', {
          max: String(ALBUM_TITLE_MAX),
        });
    }
    for (const key of ['description_ar', 'description_en'] as const) {
      if (form[key].length > ALBUM_DESCRIPTION_MAX)
        next[key] = t('admin.gallery.tooLong', {
          max: String(ALBUM_DESCRIPTION_MAX),
        });
    }
    setClientErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = (status: AlbumStatus) => {
    if (!validate()) return;
    onSubmit({
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim(),
      description_ar: form.description_ar.trim(),
      description_en: form.description_en.trim(),
      status,
      cover_image: form.cover_image,
      remove_cover: form.remove_cover,
    });
  };

  /**
   * Publishing keeps a non-draft status when editing (archived stays
   * archived unless explicitly published), matching Laravel-side rules:
   * the primary button always publishes.
   */
  const fieldError = (name: string) =>
    errors[name] ? (
      <p className="text-sm text-destructive" data-testid={`error-${name}`}>
        {errors[name]}
      </p>
    ) : null;

  const bilingualFields = (lang: 'ar' | 'en') => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleKey = `title_${lang}` as const;
    const descriptionKey = `description_${lang}` as const;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`album-title-${lang}`}>
            {t(`admin.gallery.fields.title_${lang}`)}
          </Label>
          <Input
            id={`album-title-${lang}`}
            dir={dir}
            value={form[titleKey]}
            maxLength={ALBUM_TITLE_MAX}
            onChange={(e) => set({ [titleKey]: e.target.value })}
            data-testid={`input-album-title-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[titleKey].length}/{ALBUM_TITLE_MAX}
          </p>
          {fieldError(titleKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`album-description-${lang}`}>
            {t(`admin.gallery.fields.description_${lang}`)}
          </Label>
          <Textarea
            id={`album-description-${lang}`}
            dir={dir}
            rows={4}
            value={form[descriptionKey]}
            maxLength={ALBUM_DESCRIPTION_MAX}
            onChange={(e) => set({ [descriptionKey]: e.target.value })}
            data-testid={`input-album-description-${lang}`}
          />
          <p className="text-xs text-muted-foreground">
            {form[descriptionKey].length}/{ALBUM_DESCRIPTION_MAX}
          </p>
          {fieldError(descriptionKey)}
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        data-testid="dialog-album-form"
      >
        <DialogHeader>
          <DialogTitle>
            {album
              ? t('admin.gallery.editAlbum')
              : t('admin.gallery.addAlbum')}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {album
              ? t('admin.gallery.editAlbum')
              : t('admin.gallery.addAlbum')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <Tabs defaultValue="ar">
            <TabsList className="mb-3">
              <TabsTrigger value="ar" data-testid="tab-album-form-ar">
                العربية
              </TabsTrigger>
              <TabsTrigger value="en" data-testid="tab-album-form-en">
                English
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ar">{bilingualFields('ar')}</TabsContent>
            <TabsContent value="en">{bilingualFields('en')}</TabsContent>
          </Tabs>

          <div className="space-y-1.5">
            <Label>{t('admin.gallery.fields.cover_image')}</Label>
            <FeaturedImageInput
              existingUrl={album?.cover_image_url ?? null}
              file={form.cover_image}
              removeExisting={form.remove_cover}
              onChange={({ file, removeExisting }) =>
                set({ cover_image: file, remove_cover: removeExisting })
              }
              error={errors.cover_image}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-album-cancel"
          >
            {t('admin.gallery.cancel')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => submit('draft')}
            disabled={isSaving}
            data-testid="button-album-save-draft"
          >
            {isSaving ? (
              <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Save className="me-1.5 h-4 w-4" />
            )}
            {t('admin.gallery.saveDraft')}
          </Button>
          <Button
            type="button"
            onClick={() => submit('published')}
            disabled={isSaving}
            data-testid="button-album-publish"
          >
            {isSaving ? (
              <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Send className="me-1.5 h-4 w-4" />
            )}
            {t('admin.gallery.publishAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
