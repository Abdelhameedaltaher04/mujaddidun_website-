import { useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocale } from '@/contexts/LocaleContext';
import {
  NEWS_IMAGE_MAX_BYTES,
  NEWS_IMAGE_TYPES,
} from '@/services/adminNews';

interface FeaturedImageInputProps {
  /** Existing stored image (edit mode). */
  existingUrl: string | null;
  /** Newly selected file, if any. */
  file: File | null;
  removeExisting: boolean;
  onChange: (patch: {
    file: File | null;
    removeExisting: boolean;
  }) => void;
  error?: string;
}

/**
 * Featured image picker with client-side type/size validation, local
 * preview before upload, replace, and remove. The selected `File` is sent
 * as multipart form data once the Laravel storage endpoint exists.
 */
export function FeaturedImageInput({
  existingUrl,
  file,
  removeExisting,
  onChange,
  error,
}: FeaturedImageInputProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const shownUrl = previewUrl ?? (removeExisting ? null : existingUrl);

  const selectFile = (selected: File | undefined) => {
    setLocalError(null);
    if (!selected) return;
    if (!NEWS_IMAGE_TYPES.includes(selected.type)) {
      setLocalError(t('admin.news.imageTypeError'));
      return;
    }
    if (selected.size > NEWS_IMAGE_MAX_BYTES) {
      setLocalError(t('admin.news.imageSizeError'));
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(selected));
    onChange({ file: selected, removeExisting: false });
  };

  const clearImage = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setLocalError(null);
    if (inputRef.current) inputRef.current.value = '';
    onChange({ file: null, removeExisting: existingUrl !== null });
  };

  const message = localError ?? error;

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={NEWS_IMAGE_TYPES.join(',')}
        className="hidden"
        onChange={(event) => selectFile(event.target.files?.[0])}
        data-testid="input-featured-image"
      />
      {shownUrl ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <img
            src={shownUrl}
            alt=""
            className="h-48 w-full object-cover"
            data-testid="img-featured-preview"
          />
          <div className="flex items-center gap-2 border-t border-border bg-muted/40 p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              data-testid="button-replace-image"
            >
              <RefreshCw className="me-1.5 h-4 w-4" />
              {t('admin.news.replaceImage')}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={clearImage}
              data-testid="button-remove-image"
            >
              <Trash2 className="me-1.5 h-4 w-4" />
              {t('admin.news.removeImage')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-40 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
          data-testid="button-upload-image"
        >
          <ImagePlus className="h-8 w-8" />
          <span className="text-sm font-medium">
            {t('admin.news.uploadImage')}
          </span>
          <span className="text-xs">{t('admin.news.imageHint')}</span>
        </button>
      )}
      {message ? (
        <p className="text-sm text-destructive" data-testid="text-image-error">
          {message}
        </p>
      ) : null}
    </div>
  );
}
