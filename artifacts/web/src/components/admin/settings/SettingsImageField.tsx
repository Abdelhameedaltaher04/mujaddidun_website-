import { useEffect, useRef, useState } from 'react';
import { ImageIcon, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import {
  SETTINGS_IMAGE_MAX_BYTES,
  SETTINGS_IMAGE_TYPES,
} from '@/services/adminSettings';

export interface ImageFieldValue {
  file: File | null;
  removeExisting: boolean;
}

export const EMPTY_IMAGE_VALUE: ImageFieldValue = {
  file: null,
  removeExisting: false,
};

interface SettingsImageFieldProps {
  label: string;
  existingUrl: string | null;
  value: ImageFieldValue;
  onChange: (value: ImageFieldValue) => void;
  testId: string;
}

/**
 * Image field with preview + upload/replace/remove for JPG/PNG/WEBP/SVG.
 * Files are held locally until the section is saved (multipart later).
 */
export function SettingsImageField({
  label,
  existingUrl,
  value,
  onChange,
  testId,
}: SettingsImageFieldProps) {
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

  const preview =
    objectUrl ?? (value.removeExisting ? null : existingUrl);

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    if (!SETTINGS_IMAGE_TYPES.includes(file.type)) {
      setError(t('admin.settings.imageTypeError'));
      return;
    }
    if (file.size > SETTINGS_IMAGE_MAX_BYTES) {
      setError(t('admin.settings.imageSizeError'));
      return;
    }
    setError(null);
    onChange({ file, removeExisting: false });
  };

  const handleRemove = () => {
    setError(null);
    if (value.file) {
      onChange({ file: null, removeExisting: value.removeExisting });
    } else {
      onChange({ file: null, removeExisting: true });
    }
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
          {preview ? (
            <img
              src={preview}
              alt={label}
              className="h-full w-full object-contain"
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
              ? t('admin.settings.replaceImage')
              : t('admin.settings.uploadImage')}
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
              {t('admin.settings.removeImage')}
            </Button>
          ) : null}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".jpg,.jpeg,.png,.webp,.svg,image/jpeg,image/png,image/webp,image/svg+xml"
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
