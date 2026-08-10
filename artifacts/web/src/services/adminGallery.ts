/**
 * Admin gallery management services (albums + images).
 *
 * Functions mirror the future Laravel endpoints noted alongside them and
 * use the exact payload shapes (Laravel paginator envelope, multipart-ready
 * inputs), so the API swap replaces only the mock calls with `apiClient`
 * requests. Laravel Policies must enforce admin/moderator access on every
 * endpoint.
 *
 * Album endpoints:
 *   GET    /gallery/albums          (list; server-side filters + pagination)
 *   GET    /gallery/albums/{id}
 *   POST   /gallery/albums          (multipart when cover_image present)
 *   PUT    /gallery/albums/{id}
 *   DELETE /gallery/albums/{id}
 *
 * Image endpoints:
 *   GET    /gallery/albums/{id}/images
 *   POST   /gallery/albums/{id}/images   (multipart, multiple files)
 *   PUT    /gallery/images/{id}          (metadata; multipart when replacing file)
 *   DELETE /gallery/images/{id}
 *   PATCH  /gallery/images/{id}/cover    (set as album cover)
 */
import type { PaginatedResponse } from './adminNews';
import { mockGalleryDb } from './mocks/adminGalleryMock';

export type AlbumStatus = 'draft' | 'published' | 'archived';

export const ALBUM_STATUSES: AlbumStatus[] = [
  'draft',
  'published',
  'archived',
];

export const ALBUM_TITLE_MAX = 150;
export const ALBUM_DESCRIPTION_MAX = 500;
/** JPG / PNG / WEBP up to 5MB — applies to covers and gallery images. */
export const GALLERY_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const GALLERY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface GalleryAlbum {
  id: number;
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  status: AlbumStatus;
  cover_image_url: string | null;
  images_count: number;
  created_at: string;
  updated_at: string;
}

export interface AlbumInput {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  status: AlbumStatus;
  /** New cover file; sent as multipart `cover_image` when present. */
  cover_image: File | null;
  remove_cover: boolean;
}

export interface AlbumsListParams {
  search?: string;
  status?: AlbumStatus;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface GalleryImage {
  id: number;
  album_id: number;
  url: string;
  title_ar: string;
  title_en: string;
  /** Required for accessibility. */
  alt_ar: string;
  alt_en: string;
  caption_ar: string;
  caption_en: string;
  is_cover: boolean;
  created_at: string;
  updated_at: string;
}

export interface ImageMetadataInput {
  title_ar: string;
  title_en: string;
  alt_ar: string;
  alt_en: string;
  caption_ar: string;
  caption_en: string;
  /** Replacement file; sent as multipart `image` when present. */
  image?: File | null;
}

/** One item of a multi-file upload: the file plus its required alt text. */
export interface UploadImageItem {
  file: File;
  alt_ar: string;
  alt_en: string;
}

export const adminGalleryAlbumsApi = {
  /** GET /gallery/albums */
  listAlbums(
    params: AlbumsListParams,
  ): Promise<PaginatedResponse<GalleryAlbum>> {
    return mockGalleryDb.listAlbums(params);
  },

  /** GET /gallery/albums/{id} */
  getAlbum(id: number): Promise<GalleryAlbum> {
    return mockGalleryDb.getAlbum(id);
  },

  /** POST /gallery/albums */
  createAlbum(input: AlbumInput): Promise<GalleryAlbum> {
    return mockGalleryDb.createAlbum(input);
  },

  /** PUT /gallery/albums/{id} */
  updateAlbum(id: number, input: AlbumInput): Promise<GalleryAlbum> {
    return mockGalleryDb.updateAlbum(id, input);
  },

  /** PUT /gallery/albums/{id} — status-only convenience transitions. */
  setAlbumStatus(id: number, status: AlbumStatus): Promise<GalleryAlbum> {
    return mockGalleryDb.setAlbumStatus(id, status);
  },

  /** DELETE /gallery/albums/{id} */
  deleteAlbum(id: number): Promise<void> {
    return mockGalleryDb.deleteAlbum(id);
  },
};

export const adminGalleryImagesApi = {
  /** GET /gallery/albums/{id}/images */
  listImages(albumId: number): Promise<GalleryImage[]> {
    return mockGalleryDb.listImages(albumId);
  },

  /**
   * POST /gallery/albums/{id}/images — multipart multi-file upload.
   * `onProgress` maps to axios `onUploadProgress` once the API is wired.
   */
  uploadImages(
    albumId: number,
    items: UploadImageItem[],
    onProgress?: (percent: number) => void,
  ): Promise<GalleryImage[]> {
    return mockGalleryDb.uploadImages(albumId, items, onProgress);
  },

  /** PUT /gallery/images/{id} */
  updateImage(id: number, input: ImageMetadataInput): Promise<GalleryImage> {
    return mockGalleryDb.updateImage(id, input);
  },

  /** DELETE /gallery/images/{id} */
  deleteImage(id: number): Promise<void> {
    return mockGalleryDb.deleteImage(id);
  },

  /** PATCH /gallery/images/{id}/cover */
  setAsCover(id: number): Promise<GalleryImage> {
    return mockGalleryDb.setAsCover(id);
  },
};
