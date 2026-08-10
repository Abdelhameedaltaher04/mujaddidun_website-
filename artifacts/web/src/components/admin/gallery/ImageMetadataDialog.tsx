import { useEffect, useRef, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
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
import {
  GALLERY_IMAGE_MAX_BYTES,
  GALLERY_IMAGE_TYPES,
  type GalleryImage,
  type ImageMetadataInput,
} from '@/services/adminGallery';

interface ImageMetadataDialogProps {
  image: GalleryImage | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isSaving: boolean;
  onSubmit: (input: ImageMetadataInput) => void;
}

interface FormState {
  title_ar: string;
  title_en: string;
  alt_ar: string;
  alt_en: string;
  caption_ar: string;
  caption_en: string;
  replacement: File | null;
}

/** Edit an image's bilingual metadata and optionally replace its file. */
export function ImageMetadataDialog({
  image,
  open,
  onOpenChange,
  isSaving,
  onSubmit,
}: ImageMetadataDialogProps) {
  const { t } = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>({
    title_ar: '',
    title_en: '',
    alt_ar: '',
    alt_en: '',
    caption_ar: '',
    caption_en: '',
    replacement: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  /** Preview URL for a chosen replacement file; revoked on change/close. */
  const [replacementUrl, setReplacementUrl] = useState<string | null>(null);
  const replacementUrlRef = useRef<string | null>(null);
  replacementUrlRef.current = replacementUrl;

  useEffect(() => {
    if (open && image) {
      setForm({
        title_ar: image.title_ar,
        title_en: image.title_en,
        alt_ar: image.alt_ar,
        alt_en: image.alt_en,
        caption_ar: image.caption_ar,
        caption_en: image.caption_en,
        replacement: null,
      });
      setErrors({});
      setReplacementUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    }
  }, [open, image]);

  useEffect(
    () => () => {
      if (replacementUrlRef.current)
        URL.revokeObjectURL(replacementUrlRef.current);
    },
    [],
  );

  if (!image) return null;

  const set = (patch: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) delete next[key];
      return next;
    });
  };

  const chooseReplacement = (file: File | null) => {
    if (file) {
      if (!GALLERY_IMAGE_TYPES.includes(file.type)) {
        setErrors((prev) => ({
          ...prev,
          replacement: t('admin.gallery.upload.typeError', {
            name: file.name,
          }),
        }));
        return;
      }
      if (file.size > GALLERY_IMAGE_MAX_BYTES) {
        setErrors((prev) => ({
          ...prev,
          replacement: t('admin.gallery.upload.sizeError', {
            name: file.name,
          }),
        }));
        return;
      }
    }
    setReplacementUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
    set({ replacement: file });
  };

  const submit = () => {
    const next: Record<string, string> = {};
    const required = t('admin.gallery.required');
    /** Alt text stays mandatory for accessibility. */
    if (!form.alt_ar.trim()) next.alt_ar = required;
    if (!form.alt_en.trim()) next.alt_en = required;
    setErrors(next);
    if (Object.keys(next).length) return;
    onSubmit({
      title_ar: form.title_ar.trim(),
      title_en: form.title_en.trim(),
      alt_ar: form.alt_ar.trim(),
      alt_en: form.alt_en.trim(),
      caption_ar: form.caption_ar.trim(),
      caption_en: form.caption_en.trim(),
      image: form.replacement,
    });
  };

  const fieldError = (name: string) =>
    errors[name] ? (
      <p className="text-sm text-destructive" data-testid={`error-${name}`}>
        {errors[name]}
      </p>
    ) : null;

  const bilingualFields = (lang: 'ar' | 'en') => {
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    const titleKey = `title_${lang}` as const;
    const altKey = `alt_${lang}` as const;
    const captionKey = `caption_${lang}` as const;
    return (
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor={`image-title-${lang}`}>
            {t(`admin.gallery.fields.image_title_${lang}`)}
          </Label>
          <Input
            id={`image-title-${lang}`}
            dir={dir}
            value={form[titleKey]}
            onChange={(e) => set({ [titleKey]: e.target.value })}
            data-testid={`input-image-title-${lang}`}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`image-alt-${lang}`}>
            {t(`admin.gallery.fields.alt_${lang}`)}
          </Label>
          <Input
            id={`image-alt-${lang}`}
            dir={dir}
            value={form[altKey]}
            onChange={(e) => set({ [altKey]: e.target.value })}
            data-testid={`input-image-alt-${lang}`}
          />
          {fieldError(altKey)}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`image-caption-${lang}`}>
            {t(`admin.gallery.fields.caption_${lang}`)}
          </Label>
          <Textarea
            id={`image-caption-${lang}`}
            dir={dir}
            rows={2}
            value={form[captionKey]}
            onChange={(e) => set({ [captionKey]: e.target.value })}
            data-testid={`input-image-caption-${lang}`}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isSaving && onOpenChange(o)}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        data-testid="dialog-image-metadata"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.gallery.imageMetadataTitle')}</DialogTitle>
          <DialogDescription className="sr-only">
            {t('admin.gallery.imageMetadataTitle')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <img
              src={replacementUrl ?? image.url}
              alt={form.alt_en || form.alt_ar}
              className="h-24 w-32 shrink-0 rounded-md border border-border object-cover"
              data-testid="img-metadata-preview"
            />
            <div className="space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={isSaving}
                data-testid="button-replace-image"
              >
                <RefreshCw className="me-1.5 h-4 w-4" />
                {t('admin.gallery.replaceImage')}
              </Button>
              {form.replacement ? (
                <p className="text-xs text-muted-foreground" dir="ltr">
                  {form.replacement.name}
                </p>
              ) : null}
              {fieldError('replacement')}
              <input
                ref={fileRef}
                type="file"
                accept={GALLERY_IMAGE_TYPES.join(',')}
                className="hidden"
                onChange={(e) => {
                  chooseReplacement(e.target.files?.[0] ?? null);
                  e.target.value = '';
                }}
                data-testid="input-replace-image"
              />
            </div>
          </div>

          <Tabs defaultValue="ar">
            <TabsList className="mb-3">
              <TabsTrigger value="ar" data-testid="tab-image-metadata-ar">
                العربية
              </TabsTrigger>
              <TabsTrigger value="en" data-testid="tab-image-metadata-en">
                English
              </TabsTrigger>
            </TabsList>
            <TabsContent value="ar">{bilingualFields('ar')}</TabsContent>
            <TabsContent value="en">{bilingualFields('en')}</TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
            data-testid="button-metadata-cancel"
          >
            {t('admin.gallery.cancel')}
          </Button>
          <Button
            onClick={submit}
            disabled={isSaving}
            data-testid="button-metadata-save"
          >
            {isSaving ? (
              <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
            ) : null}
            {t('admin.gallery.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
