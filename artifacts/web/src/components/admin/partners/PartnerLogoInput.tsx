import { useEffect, useRef, useState } from 'react';
import { ImagePlus, RefreshCw, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useLocale } from '@/contexts/LocaleContext';
import {
  PARTNER_LOGO_MAX_BYTES,
  PARTNER_LOGO_TYPES,
} from '@/services/adminPartners';

interface PartnerLogoInputProps {
  existingUrl: string | null;
  file: File | null;
  onChange: (file: File | null) => void;
  /** Server/parent validation error, shown when no local error exists. */
  error?: string;
}

/**
 * Logo picker with preview (aspect ratio preserved via object-contain),
 * replace and remove actions, and JPG/PNG/WEBP/SVG + 5MB validation.
 */
export function PartnerLogoInput({
  existingUrl,
  file,
  onChange,
  error,
}: PartnerLogoInputProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const previewUrl = objectUrl ?? existingUrl;

  const handleSelect = (selected: File | undefined) => {
    if (!selected) return;
    if (!PARTNER_LOGO_TYPES.includes(selected.type)) {
      setLocalError(t('admin.partners.logoTypeError'));
      return;
    }
    if (selected.size > PARTNER_LOGO_MAX_BYTES) {
      setLocalError(t('admin.partners.logoSizeError'));
      return;
    }
    setLocalError(null);
    onChange(selected);
  };

  const message = localError ?? error;

  return (
    <div className="space-y-2">
      <Label>{t('admin.partners.fields.logo')} *</Label>
      <input
        ref={inputRef}
        type="file"
        accept={PARTNER_LOGO_TYPES.join(',')}
        className="hidden"
        onChange={(event) => {
          handleSelect(event.target.files?.[0]);
          event.target.value = '';
        }}
        data-testid="input-partner-logo"
      />
      {previewUrl ? (
        <div className="space-y-2">
          <div className="flex h-32 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40 p-3">
            <img
              src={previewUrl}
              alt=""
              className="max-h-full max-w-full object-contain"
              data-testid="img-partner-logo-preview"
            />
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              data-testid="button-replace-logo"
            >
              <RefreshCw className="me-1.5 h-4 w-4" />
              {t('admin.partners.replaceLogo')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => {
                setLocalError(null);
                onChange(null);
              }}
              data-testid="button-remove-logo"
            >
              <Trash2 className="me-1.5 h-4 w-4" />
              {t('admin.partners.removeLogo')}
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          data-testid="button-upload-logo"
        >
          <ImagePlus className="h-6 w-6" />
          <span className="text-sm">{t('admin.partners.uploadLogo')}</span>
          <span className="text-xs">{t('admin.partners.logoFormats')}</span>
        </button>
      )}
      {message ? (
        <p className="text-sm text-destructive" data-testid="text-logo-error">
          {message}
        </p>
      ) : null}
    </div>
  );
}
