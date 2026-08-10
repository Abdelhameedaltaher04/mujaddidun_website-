import {
  Archive,
  Eye,
  Globe,
  Images,
  MoreHorizontal,
  Pencil,
  Trash2,
  Undo2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useLocale } from '@/contexts/LocaleContext';
import type { GalleryAlbum } from '@/services/adminGallery';
import { AlbumStatusBadge } from './albumBadges';

export interface AlbumActions {
  onView: (album: GalleryAlbum) => void;
  onEdit: (album: GalleryAlbum) => void;
  onPublish: (album: GalleryAlbum) => void;
  onUnpublish: (album: GalleryAlbum) => void;
  onArchive: (album: GalleryAlbum) => void;
  onDelete: (album: GalleryAlbum) => void;
}

interface AlbumsGridProps extends AlbumActions {
  albums: GalleryAlbum[];
}

/** Responsive album grid: 1 col mobile → 2 sm → 3 lg → 4 xl. */
export function AlbumsGrid({ albums, ...actions }: AlbumsGridProps) {
  const { t, locale } = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(
    locale === 'ar' ? 'ar-JO' : 'en-US',
    { dateStyle: 'medium' },
  );
  const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {albums.map((album) => {
        const title = locale === 'ar' ? album.title_ar : album.title_en;
        const subtitle = locale === 'ar' ? album.title_en : album.title_ar;
        const canPublish = album.status !== 'published';
        const canUnpublish = album.status === 'published';
        const canArchive = album.status !== 'archived';
        return (
          <Card
            key={album.id}
            className="group overflow-hidden"
            data-testid={`card-album-${album.id}`}
          >
            <button
              type="button"
              className="relative block aspect-[3/2] w-full overflow-hidden bg-muted text-start"
              onClick={() => actions.onView(album)}
              data-testid={`album-cover-${album.id}`}
            >
              {album.cover_image_url ? (
                <img
                  src={album.cover_image_url}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center">
                  <Images className="h-10 w-10 text-muted-foreground/50" />
                </span>
              )}
              <span className="absolute bottom-2 start-2 inline-flex items-center gap-1 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                <Images className="h-3.5 w-3.5" />
                <span dir="ltr">{album.images_count}</span>
              </span>
            </button>
            <CardContent className="space-y-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  className="min-w-0 text-start"
                  onClick={() => actions.onView(album)}
                >
                  <p className="truncate font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {subtitle}
                  </p>
                </button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      data-testid={`button-album-actions-${album.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">
                        {t('admin.gallery.actions')}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => actions.onView(album)}
                      data-testid={`album-action-view-${album.id}`}
                    >
                      <Eye className="me-2 h-4 w-4" />
                      {t('admin.gallery.actionView')}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => actions.onEdit(album)}
                      data-testid={`album-action-edit-${album.id}`}
                    >
                      <Pencil className="me-2 h-4 w-4" />
                      {t('admin.gallery.actionEdit')}
                    </DropdownMenuItem>
                    {canPublish ? (
                      <DropdownMenuItem
                        onClick={() => actions.onPublish(album)}
                        data-testid={`album-action-publish-${album.id}`}
                      >
                        <Globe className="me-2 h-4 w-4" />
                        {t('admin.gallery.actionPublish')}
                      </DropdownMenuItem>
                    ) : null}
                    {canUnpublish ? (
                      <DropdownMenuItem
                        onClick={() => actions.onUnpublish(album)}
                        data-testid={`album-action-unpublish-${album.id}`}
                      >
                        <Undo2 className="me-2 h-4 w-4" />
                        {t('admin.gallery.actionUnpublish')}
                      </DropdownMenuItem>
                    ) : null}
                    {canArchive ? (
                      <DropdownMenuItem
                        onClick={() => actions.onArchive(album)}
                        data-testid={`album-action-archive-${album.id}`}
                      >
                        <Archive className="me-2 h-4 w-4" />
                        {t('admin.gallery.actionArchive')}
                      </DropdownMenuItem>
                    ) : null}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => actions.onDelete(album)}
                      className="text-destructive focus:text-destructive"
                      data-testid={`album-action-delete-${album.id}`}
                    >
                      <Trash2 className="me-2 h-4 w-4" />
                      {t('admin.gallery.actionDelete')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <AlbumStatusBadge status={album.status} />
                <span className="ms-auto text-xs text-muted-foreground">
                  {t('admin.gallery.imagesCount', {
                    count: String(album.images_count),
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span>
                  {t('admin.gallery.createdOn', {
                    date: formatDate(album.created_at),
                  })}
                </span>
                <span>
                  {t('admin.gallery.updatedOn', {
                    date: formatDate(album.updated_at),
                  })}
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
