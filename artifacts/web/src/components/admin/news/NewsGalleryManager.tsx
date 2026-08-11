import { useState } from 'react';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ImageUploaderDialog } from '@/components/admin/gallery/ImageUploaderDialog';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import type { UploadImageItem } from '@/services/adminGallery';
import type { NewsGalleryImage } from '@/services/newsImages';
import {
  useDeleteNewsImage,
  useNewsImages,
  useReorderNewsImages,
  useUploadNewsImages,
} from '@/hooks/useNewsImages';

/**
 * Gallery images section on the news edit page: upload (reusing the
 * gallery uploader dialog), list, reorder via up/down, and delete.
 */
export function NewsGalleryManager({ newsId }: { newsId: number }) {
  const { t, locale } = useLocale();
  const { toast } = useToast();
  const images = useNewsImages(newsId);
  const upload = useUploadNewsImages(newsId);
  const reorder = useReorderNewsImages(newsId);
  const remove = useDeleteNewsImage(newsId);

  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NewsGalleryImage | null>(null);

  const list = images.data ?? [];
  const busy = reorder.isPending || remove.isPending;

  const handleUpload = (items: UploadImageItem[]) => {
    setUploadError(null);
    setProgress(0);
    upload.mutate(
      { items, onProgress: setProgress },
      {
        onSuccess: () => {
          setProgress(null);
          setUploaderOpen(false);
          toast({ description: t('admin.news.gallery.uploadSuccess') });
        },
        onError: (error) => {
          setProgress(null);
          setUploadError(
            getApiError(error).message || t('admin.news.genericError'),
          );
        },
      },
    );
  };

  const move = (index: number, delta: -1 | 1) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const order = list.map((image) => image.id);
    [order[index], order[target]] = [order[target], order[index]];
    reorder.mutate(order, {
      onError: (error) =>
        toast({
          variant: 'destructive',
          description: getApiError(error).message || t('admin.news.genericError'),
        }),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast({ description: t('admin.news.gallery.deleteSuccess') });
      },
      onError: (error) => {
        setDeleteTarget(null);
        toast({
          variant: 'destructive',
          description: getApiError(error).message || t('admin.news.genericError'),
        });
      },
    });
  };

  return (
    <Card data-testid="card-news-gallery">
      <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0">
        <CardTitle className="text-lg">{t('admin.news.gallery.title')}</CardTitle>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setUploadError(null);
            setUploaderOpen(true);
          }}
          data-testid="button-add-gallery-images"
        >
          <ImagePlus className="h-4 w-4 me-2" />
          {t('admin.news.gallery.add')}
        </Button>
      </CardHeader>
      <CardContent>
        {images.isPending ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : images.isError ? (
          <div className="flex flex-col items-center gap-3 py-8 text-center">
            <p className="text-sm text-destructive">
              {getApiError(images.error).message || t('admin.news.genericError')}
            </p>
            <Button type="button" variant="outline" size="sm" onClick={() => images.refetch()}>
              {t('admin.news.retry')}
            </Button>
          </div>
        ) : list.length === 0 ? (
          <p
            className="py-8 text-center text-sm text-muted-foreground"
            data-testid="text-gallery-empty"
          >
            {t('admin.news.gallery.empty')}
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {list.map((image, index) => (
              <div
                key={image.id}
                className="group relative overflow-hidden rounded-lg border border-border bg-muted"
                data-testid={`gallery-image-${image.id}`}
              >
                <img
                  src={image.image}
                  alt={locale === 'ar' ? image.alt_text_ar : image.alt_text_en}
                  className="aspect-square w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-background/85 p-1.5 backdrop-blur-sm">
                  <span className="ps-1 text-xs font-medium text-muted-foreground">
                    {index + 1}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={busy || index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={t('admin.news.gallery.moveUp')}
                      data-testid={`button-image-up-${image.id}`}
                    >
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      disabled={busy || index === list.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t('admin.news.gallery.moveDown')}
                      data-testid={`button-image-down-${image.id}`}
                    >
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive hover:text-destructive"
                      disabled={busy}
                      onClick={() => setDeleteTarget(image)}
                      aria-label={t('admin.news.gallery.delete')}
                      data-testid={`button-image-delete-${image.id}`}
                    >
                      {remove.isPending && deleteTarget?.id === image.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <ImageUploaderDialog
        open={uploaderOpen}
        onOpenChange={(open) => {
          if (!upload.isPending) setUploaderOpen(open);
        }}
        isUploading={upload.isPending}
        progress={progress}
        uploadError={uploadError}
        onUpload={handleUpload}
      />

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open && !remove.isPending) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('admin.news.gallery.deleteTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('admin.news.gallery.deleteConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={remove.isPending}>
              {t('common.cancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                confirmDelete();
              }}
              disabled={remove.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete-image"
            >
              {t('admin.news.gallery.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
