import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import { CONTENT_IMAGE_MAX_BYTES } from '@/services/adminContent';

const CONTENT_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export interface ContentImageValue {
  file: File | null;
  removeExisting: boolean;
}

export const EMPTY_CONTENT_IMAGE: ContentImageValue = {
  file: null,
  removeExisting: false,
};

interface ContentImageFieldProps {
  label: string;
  existingUrl: string | null;
  value: ContentImageValue;
  onChange: (value: ContentImageValue) => void;
  testId: string;
}

/**
 * Image field with preview + upload/replace/remove for JPG/PNG/WEBP,
 * validated client-side against CONTENT_IMAGE_MAX_BYTES. Files are held
 * locally until the section is saved (multipart later).
 */
export function ContentImageField({
  label,
  existingUrl,
  value,
  onChange,
  testId,
}: ContentImageFieldProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!value.file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(value.file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [value.file]);

  const preview = objectUrl ?? (value.removeExisting ? null : existingUrl);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!CONTENT_IMAGE_TYPES.includes(file.type)) {
      setError(t('admin.content.imageTypeError'));
      return;
    }
    if (file.size > CONTENT_IMAGE_MAX_BYTES) {
      setError(t('admin.content.imageSizeError'));
      return;
    }
    setError(null);
    onChange({ file, removeExisting: false });
  };

  const handleRemove = () => {
    setError(null);
    onChange({ file: null, removeExisting: true });
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-20 w-32 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-cover"
              data-testid={`${testId}-preview`}
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            data-testid={`${testId}-upload`}
          >
            <Upload className="me-1.5 h-4 w-4" />
            {preview
              ? t('admin.content.replaceImage')
              : t('admin.content.uploadImage')}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={handleRemove}
              data-testid={`${testId}-remove`}
            >
              <Trash2 className="me-1.5 h-4 w-4" />
              {t('admin.content.removeImage')}
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        {t('admin.content.imageHelp')}
      </p>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(event) => handleFile(event.target.files?.[0])}
        data-testid={`${testId}-input`}
      />
      {error ? (
        <p className="text-sm text-destructive" data-testid={`${testId}-error`}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
