import { useEffect, useRef, useState } from 'react';
import { Loader2, Upload, UploadCloud, X } from 'lucide-react';
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
import { Progress } from '@/components/ui/progress';
import { useLocale } from '@/contexts/LocaleContext';
import { cn } from '@/lib/utils';
import {
  GALLERY_IMAGE_MAX_BYTES,
  GALLERY_IMAGE_TYPES,
  type UploadImageItem,
} from '@/services/adminGallery';

interface SelectedImage {
  /** Local key for React lists (files can share names). */
  key: string;
  file: File;
  /** Object URL owned by this row; revoked on removal/close. */
  previewUrl: string;
  alt_ar: string;
  alt_en: string;
}

interface ImageUploaderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isUploading: boolean;
  /** 0-100 while uploading, null otherwise. */
  progress: number | null;
  /** Upload failure message shown inside the dialog. */
  uploadError: string | null;
  onUpload: (items: UploadImageItem[]) => void;
}

let nextKey = 0;

/**
 * Multi-image uploader: drag & drop or browse, per-image previews and
 * required alt text (AR/EN), client-side type/size validation, and a
 * progress bar during upload (maps to axios onUploadProgress later).
 */
export function ImageUploaderDialog({
  open,
  onOpenChange,
  isUploading,
  progress,
  uploadError,
  onUpload,
}: ImageUploaderDialogProps) {
  const { t } = useLocale();
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<SelectedImage[]>([]);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const [altErrors, setAltErrors] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);

  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  const reset = () => {
    for (const item of selectedRef.current) {
      URL.revokeObjectURL(item.previewUrl);
    }
    setSelected([]);
    setFileErrors([]);
    setAltErrors({});
  };

  /** Revoke all preview URLs when the dialog closes or unmounts. */
  useEffect(() => {
    if (!open) reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => () => reset(), []); // eslint-disable-line react-hooks/exhaustive-deps

  const addFiles = (files: FileList | File[]) => {
    const errors: string[] = [];
    const accepted: SelectedImage[] = [];
    for (const file of Array.from(files)) {
      if (!GALLERY_IMAGE_TYPES.includes(file.type)) {
        errors.push(
          t('admin.gallery.upload.typeError', { name: file.name }),
        );
        continue;
      }
      if (file.size > GALLERY_IMAGE_MAX_BYTES) {
        errors.push(
          t('admin.gallery.upload.sizeError', { name: file.name }),
        );
        continue;
      }
      accepted.push({
        key: `f${++nextKey}`,
        file,
        previewUrl: URL.createObjectURL(file),
        alt_ar: '',
        alt_en: '',
      });
    }
    setFileErrors(errors);
    if (accepted.length) setSelected((prev) => [...prev, ...accepted]);
  };

  const removeItem = (key: string) => {
    setSelected((prev) => {
      const item = prev.find((row) => row.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((row) => row.key !== key);
    });
    setAltErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const setAlt = (key: string, patch: Partial<SelectedImage>) => {
    setSelected((prev) =>
      prev.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );
    setAltErrors((prev) => ({ ...prev, [key]: false }));
  };

  const startUpload = () => {
    /** Alt text is required for accessibility on every image. */
    const missing: Record<string, boolean> = {};
    for (const item of selected) {
      if (!item.alt_ar.trim() || !item.alt_en.trim()) missing[item.key] = true;
    }
    setAltErrors(missing);
    if (Object.keys(missing).length || selected.length === 0) return;
    onUpload(
      selected.map((item) => ({
        file: item.file,
        alt_ar: item.alt_ar.trim(),
        alt_en: item.alt_en.trim(),
      })),
    );
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !isUploading && onOpenChange(o)}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        data-testid="dialog-image-uploader"
      >
        <DialogHeader>
          <DialogTitle>{t('admin.gallery.upload.title')}</DialogTitle>
          <DialogDescription>
            {t('admin.gallery.upload.hint')}
          </DialogDescription>
        </DialogHeader>

        <div
          role="button"
          tabIndex={0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (!isUploading) addFiles(e.dataTransfer.files);
          }}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 text-center transition-colors',
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50',
          )}
          data-testid="dropzone-gallery-upload"
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            {t('admin.gallery.upload.dropzone')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('admin.gallery.upload.formats')}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept={GALLERY_IMAGE_TYPES.join(',')}
            multiple
            className="hidden"
            onChange={(e) => {
              if (e.target.files) addFiles(e.target.files);
              e.target.value = '';
            }}
            data-testid="input-gallery-files"
          />
        </div>

        {fileErrors.length ? (
          <div className="space-y-1" data-testid="upload-file-errors">
            {fileErrors.map((message, index) => (
              <p key={index} className="text-sm text-destructive">
                {message}
              </p>
            ))}
          </div>
        ) : null}

        {selected.length ? (
          <div className="space-y-3">
            {selected.map((item) => (
              <div
                key={item.key}
                className="flex gap-3 rounded-lg border border-border p-3"
                data-testid={`upload-item-${item.key}`}
              >
                <img
                  src={item.previewUrl}
                  alt=""
                  className="h-20 w-24 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p
                      className="truncate text-xs text-muted-foreground"
                      dir="ltr"
                    >
                      {item.file.name} ·{' '}
                      {(item.file.size / 1024 / 1024).toFixed(2)}MB
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => removeItem(item.key)}
                      disabled={isUploading}
                      data-testid={`button-remove-upload-${item.key}`}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">
                        {t('admin.gallery.upload.remove')}
                      </span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t('admin.gallery.fields.alt_ar')}
                      </Label>
                      <Input
                        dir="rtl"
                        value={item.alt_ar}
                        onChange={(e) =>
                          setAlt(item.key, { alt_ar: e.target.value })
                        }
                        disabled={isUploading}
                        data-testid={`input-alt-ar-${item.key}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">
                        {t('admin.gallery.fields.alt_en')}
                      </Label>
                      <Input
                        dir="ltr"
                        value={item.alt_en}
                        onChange={(e) =>
                          setAlt(item.key, { alt_en: e.target.value })
                        }
                        disabled={isUploading}
                        data-testid={`input-alt-en-${item.key}`}
                      />
                    </div>
                  </div>
                  {altErrors[item.key] ? (
                    <p
                      className="text-xs text-destructive"
                      data-testid={`error-alt-${item.key}`}
                    >
                      {t('admin.gallery.upload.altRequired')}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {isUploading && progress !== null ? (
          <div className="space-y-1" data-testid="upload-progress">
            <Progress value={progress} />
            <p className="text-center text-xs text-muted-foreground" dir="ltr">
              {progress}%
            </p>
          </div>
        ) : null}

        {uploadError ? (
          <p
            className="text-sm text-destructive"
            data-testid="upload-error"
          >
            {uploadError}
          </p>
        ) : null}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isUploading}
            data-testid="button-upload-cancel"
          >
            {t('admin.gallery.cancel')}
          </Button>
          <Button
            onClick={startUpload}
            disabled={isUploading || selected.length === 0}
            data-testid="button-upload-start"
          >
            {isUploading ? (
              <Loader2 className="me-1.5 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="me-1.5 h-4 w-4" />
            )}
            {t('admin.gallery.upload.startUpload', {
              count: String(selected.length),
            })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
