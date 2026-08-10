import { useState } from 'react';
import { Link, useParams } from 'wouter';
import {
  ArrowLeft,
  ArrowRight,
  ImagePlus,
  Images,
  MoreHorizontal,
  Pencil,
  RefreshCw,
  Star,
  Trash2,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useLocale } from '@/contexts/LocaleContext';
import { getApiError } from '@/services/api';
import { AlbumStatusBadge } from '@/components/admin/gallery/albumBadges';
import { ImageUploaderDialog } from '@/components/admin/gallery/ImageUploaderDialog';
import { ImageMetadataDialog } from '@/components/admin/gallery/ImageMetadataDialog';
import { AdminImageLightbox } from '@/components/admin/gallery/AdminImageLightbox';
import { GalleryConfirmDialog } from '@/components/admin/gallery/GalleryConfirmDialogs';
import {
  useAdminAlbum,
  useAlbumImages,
  useDeleteImage,
  useSetImageAsCover,
  useUpdateImage,
  useUploadImages,
} from '@/hooks/useAdminGallery';
import type {
  GalleryImage,
  ImageMetadataInput,
  UploadImageItem,
} from '@/services/adminGallery';

type DialogKind = 'upload' | 'metadata' | 'cover' | 'delete' | null;

/**
 * Album details: responsive image grid with lightbox, multi-upload,
 * per-image metadata editing / replace / set-cover / delete.
 */
export default function AdminAlbumDetailsPage() {
  const { t, locale, dir } = useLocale();
  const { toast } = useToast();
  const routeParams = useParams<{ id: string }>();
  const albumId = Number(routeParams.id);
  const validId = Number.isFinite(albumId) ? albumId : null;

  const album = useAdminAlbum(validId);
  const imagesQuery = useAlbumImages(validId);
  const upload = useUploadImages();
  const updateImage = useUpdateImage();
  const deleteImage = useDeleteImage();
  const setCover = useSetImageAsCover();

  const [dialog, setDialog] = useState<DialogKind>(null);
  const [selected, setSelected] = useState<GalleryImage | null>(null);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const BackIcon = dir === 'rtl' ? ArrowRight : ArrowLeft;
  const images = imagesQuery.data ?? [];

  const errorMessage = (error: unknown) =>
    getApiError(error).message || t('admin.gallery.genericError');
  const notifyError = (error: unknown) =>
    toast({ variant: 'destructive', description: errorMessage(error) });

  const closeDialog = () => setDialog(null);
  const openDialog =
    (kind: Exclude<DialogKind, 'upload' | null>) => (image: GalleryImage) => {
      setSelected(image);
      setDialog(kind);
    };

  const startUpload = (items: UploadImageItem[]) => {
    if (!validId) return;
    setUploadError(null);
    setUploadProgress(0);
    upload.mutate(
      {
        albumId: validId,
        items,
        onProgress: setUploadProgress,
      },
      {
        onSuccess: (created) => {
          setUploadProgress(null);
          closeDialog();
          toast({
            description: t('admin.gallery.upload.success', {
              count: String(created.length),
            }),
          });
        },
        onError: (error) => {
          setUploadProgress(null);
          setUploadError(errorMessage(error));
        },
      },
    );
  };

  const saveMetadata = (input: ImageMetadataInput) => {
    if (!selected) return;
    updateImage.mutate(
      { id: selected.id, input },
      {
        onSuccess: () => {
          closeDialog();
          toast({ description: t('admin.gallery.metadataSaved') });
        },
        onError: notifyError,
      },
    );
  };

  const albumTitle = album.data
    ? locale === 'ar'
      ? album.data.title_ar
      : album.data.title_en
    : '';
  const albumDescription = album.data
    ? locale === 'ar'
      ? album.data.description_ar
      : album.data.description_en
    : '';

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Link
              href="/admin/gallery"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              data-testid="link-back-to-gallery"
            >
              <BackIcon className="h-4 w-4" />
              {t('admin.gallery.backToList')}
            </Link>
            {album.isPending ? (
              <Skeleton className="mt-2 h-8 w-64" />
            ) : album.data ? (
              <>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <h1
                    className="text-2xl font-bold text-foreground sm:text-3xl"
                    data-testid="text-album-title"
                  >
                    {albumTitle}
                  </h1>
                  <AlbumStatusBadge status={album.data.status} />
                </div>
                {albumDescription ? (
                  <p className="mt-1 max-w-2xl text-muted-foreground">
                    {albumDescription}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-muted-foreground">
                  {t('admin.gallery.imagesCount', {
                    count: String(album.data.images_count),
                  })}
                </p>
              </>
            ) : null}
          </div>
          <Button
            onClick={() => {
              setUploadError(null);
              setDialog('upload');
            }}
            data-testid="button-upload-images"
          >
            <ImagePlus className="me-1.5 h-4 w-4" />
            {t('admin.gallery.uploadImages')}
          </Button>
        </div>

        {imagesQuery.isPending ? (
          <div
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
            data-testid="images-loading"
          >
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton
                key={index}
                className="aspect-square w-full rounded-lg"
              />
            ))}
          </div>
        ) : imagesQuery.isError ? (
          <Card data-testid="images-error">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="text-sm text-destructive">
                {errorMessage(imagesQuery.error)}
              </p>
              <Button
                variant="outline"
                onClick={() => imagesQuery.refetch()}
                data-testid="button-retry-images"
              >
                <RefreshCw className="me-2 h-4 w-4" />
                {t('admin.gallery.retry')}
              </Button>
            </CardContent>
          </Card>
        ) : images.length === 0 ? (
          <Card data-testid="images-empty">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Images className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">
                {t('admin.gallery.noImages')}
              </p>
              <Button
                size="sm"
                onClick={() => {
                  setUploadError(null);
                  setDialog('upload');
                }}
              >
                <ImagePlus className="me-1.5 h-4 w-4" />
                {t('admin.gallery.uploadImages')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {images.map((image, index) => {
              const alt = locale === 'ar' ? image.alt_ar : image.alt_en;
              return (
                <div
                  key={image.id}
                  className="group relative overflow-hidden rounded-lg border border-border bg-muted"
                  data-testid={`image-tile-${image.id}`}
                >
                  <button
                    type="button"
                    className="block aspect-square w-full"
                    onClick={() => setLightboxIndex(index)}
                    data-testid={`button-open-image-${image.id}`}
                  >
                    <img
                      src={image.url}
                      alt={alt}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </button>
                  {image.is_cover ? (
                    <Badge
                      className="absolute top-2 start-2 gap-1 border-transparent bg-black/60 text-white backdrop-blur-sm hover:bg-black/60"
                      data-testid={`badge-cover-${image.id}`}
                    >
                      <Star className="h-3 w-3 fill-current" />
                      {t('admin.gallery.coverBadge')}
                    </Badge>
                  ) : null}
                  <div className="absolute top-2 end-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-black/60 text-white backdrop-blur-sm hover:bg-black/75"
                          data-testid={`button-image-actions-${image.id}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">
                            {t('admin.gallery.actions')}
                          </span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setLightboxIndex(index)}
                          data-testid={`image-action-preview-${image.id}`}
                        >
                          <Images className="me-2 h-4 w-4" />
                          {t('admin.gallery.actionPreview')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => openDialog('metadata')(image)}
                          data-testid={`image-action-edit-${image.id}`}
                        >
                          <Pencil className="me-2 h-4 w-4" />
                          {t('admin.gallery.actionEditMetadata')}
                        </DropdownMenuItem>
                        {!image.is_cover ? (
                          <DropdownMenuItem
                            onClick={() => openDialog('cover')(image)}
                            data-testid={`image-action-cover-${image.id}`}
                          >
                            <Star className="me-2 h-4 w-4" />
                            {t('admin.gallery.actionSetCover')}
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => openDialog('delete')(image)}
                          className="text-destructive focus:text-destructive"
                          data-testid={`image-action-delete-${image.id}`}
                        >
                          <Trash2 className="me-2 h-4 w-4" />
                          {t('admin.gallery.actionDelete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageUploaderDialog
        open={dialog === 'upload'}
        onOpenChange={(open) => !open && closeDialog()}
        isUploading={upload.isPending}
        progress={uploadProgress}
        uploadError={uploadError}
        onUpload={startUpload}
      />

      <ImageMetadataDialog
        image={selected}
        open={dialog === 'metadata'}
        onOpenChange={(open) => !open && closeDialog()}
        isSaving={updateImage.isPending}
        onSubmit={saveMetadata}
      />

      <GalleryConfirmDialog
        open={dialog === 'cover'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={setCover.isPending}
        title={t('admin.gallery.setCoverTitle')}
        description={t('admin.gallery.setCoverDescription')}
        actionLabel={t('admin.gallery.actionSetCover')}
        testId="dialog-confirm-set-cover"
        onConfirm={() => {
          if (!selected) return;
          setCover.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.gallery.setCoverSuccess') });
            },
            onError: notifyError,
          });
        }}
      />

      <GalleryConfirmDialog
        open={dialog === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        isPending={deleteImage.isPending}
        title={t('admin.gallery.deleteImageTitle')}
        description={t('admin.gallery.deleteImageDescription')}
        actionLabel={t('admin.gallery.actionDelete')}
        destructive
        testId="dialog-confirm-image-delete"
        onConfirm={() => {
          if (!selected) return;
          deleteImage.mutate(selected.id, {
            onSuccess: () => {
              closeDialog();
              toast({ description: t('admin.gallery.imageDeletedSuccess') });
            },
            onError: notifyError,
          });
        }}
      />

      <AdminImageLightbox
        images={images}
        openIndex={lightboxIndex}
        onNavigate={setLightboxIndex}
        onClose={() => setLightboxIndex(null)}
      />
    </AdminLayout>
  );
}
