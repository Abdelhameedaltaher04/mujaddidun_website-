/**
 * Temporary in-memory gallery store (albums + images) emulating Laravel
 * server-side filtering, pagination, and file storage (data URLs stand in
 * for storage paths; seeded images use stable picsum URLs). Deleted once
 * the API exists.
 */
import type {
  AlbumInput,
  AlbumStatus,
  AlbumsListParams,
  GalleryAlbum,
  GalleryImage,
  ImageMetadataInput,
  UploadImageItem,
} from '../adminGallery';
import type { PaginatedResponse } from '../adminNews';

const AR_ALBUMS = [
  'حملة التشجير الوطنية',
  'مخيم الشباب الصيفي',
  'يوم العطاء المجتمعي',
  'ورشات محو الأمية الرقمية',
  'قوافل الإغاثة الشتوية',
  'ملتقى المتطوعين السنوي',
  'مبادرة إفطار صائم',
  'الحملة الصحية المدرسية',
];
const EN_ALBUMS = [
  'National Tree Planting Campaign',
  'Youth Summer Camp',
  'Community Giving Day',
  'Digital Literacy Workshops',
  'Winter Relief Convoys',
  'Annual Volunteers Forum',
  'Iftar Meals Initiative',
  'School Health Campaign',
];
const AR_CAPTIONS = [
  'جانب من فعاليات النشاط',
  'مشاركة المتطوعين في التنظيم',
  'لقطة جماعية للمشاركين',
  'توزيع المساعدات على المستفيدين',
];
const EN_CAPTIONS = [
  'A moment from the activity',
  'Volunteers helping with organization',
  'Group photo of the participants',
  'Distributing aid to beneficiaries',
];

const TODAY = new Date('2026-08-10T00:00:00Z');

function iso(offsetDays: number): string {
  return new Date(TODAY.getTime() + offsetDays * 86_400_000).toISOString();
}

function seedUrl(seed: string, w = 900, h = 600): string {
  return `https://picsum.photos/seed/mujaddidun-${seed}/${w}/${h}`;
}

function delay(ms = 350): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

let nextAlbumId = 900;
let nextImageId = 20_000;

function buildData(): { albums: GalleryAlbum[]; images: GalleryImage[] } {
  const albums: GalleryAlbum[] = [];
  const images: GalleryImage[] = [];
  for (let i = 1; i <= 14; i++) {
    const idx = (i - 1) % AR_ALBUMS.length;
    const status: AlbumStatus =
      i % 7 === 0 ? 'archived' : i % 4 === 0 ? 'draft' : 'published';
    const albumId = 800 + i;
    const imageCount = status === 'draft' ? (i % 3) * 2 : 4 + (i % 9);
    for (let j = 1; j <= imageCount; j++) {
      const cIdx = (i + j) % AR_CAPTIONS.length;
      images.push({
        id: 10_000 + i * 100 + j,
        album_id: albumId,
        url: seedUrl(`${i}-${j}`),
        title_ar: `${AR_ALBUMS[idx]} — صورة ${j}`,
        title_en: `${EN_ALBUMS[idx]} — Photo ${j}`,
        alt_ar: AR_CAPTIONS[cIdx],
        alt_en: EN_CAPTIONS[cIdx],
        caption_ar: j % 2 === 0 ? AR_CAPTIONS[cIdx] : '',
        caption_en: j % 2 === 0 ? EN_CAPTIONS[cIdx] : '',
        is_cover: j === 1,
        created_at: iso(-90 - i * 3 + j),
        updated_at: iso(-90 - i * 3 + j),
      });
    }
    albums.push({
      id: albumId,
      title_ar: `${AR_ALBUMS[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      title_en: `${EN_ALBUMS[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      description_ar:
        'ألبوم يوثق أبرز لحظات النشاط ومشاركة المتطوعين والمستفيدين.',
      description_en:
        'An album documenting the highlights of the activity with volunteers and beneficiaries.',
      status,
      cover_image_url: imageCount > 0 ? seedUrl(`${i}-1`) : null,
      images_count: imageCount,
      created_at: iso(-100 - i * 3),
      updated_at: iso(-20 - i),
    });
  }
  return { albums, images };
}

const { albums, images } = buildData();

function findAlbum(id: number): GalleryAlbum {
  const album = albums.find((a) => a.id === id);
  if (!album) throw new Error('Album not found');
  return album;
}

function findImage(id: number): GalleryImage {
  const image = images.find((img) => img.id === id);
  if (!image) throw new Error('Image not found');
  return image;
}

/**
 * Album ids whose cover is a standalone uploaded file (a "custom"
 * cover) rather than one of the album's gallery images. The cover has
 * exactly one source of truth at any time: either a custom file, or a
 * single image flagged `is_cover`. Laravel must persist the same
 * distinction (e.g. `cover_image_id` nullable FK + `custom_cover_path`).
 */
const customCoverAlbumIds = new Set<number>();

/** Removes the image-backed cover flag from all of an album's images. */
function clearImageCoverFlags(albumId: number): void {
  for (const img of images) {
    if (img.album_id === albumId) img.is_cover = false;
  }
}

async function applyAlbumInput(
  album: GalleryAlbum,
  input: AlbumInput,
): Promise<void> {
  album.title_ar = input.title_ar;
  album.title_en = input.title_en;
  album.description_ar = input.description_ar;
  album.description_en = input.description_en;
  album.status = input.status;
  if (input.remove_cover) {
    album.cover_image_url = null;
    customCoverAlbumIds.delete(album.id);
    clearImageCoverFlags(album.id);
  }
  if (input.cover_image) {
    album.cover_image_url = await fileToDataUrl(input.cover_image);
    customCoverAlbumIds.add(album.id);
    clearImageCoverFlags(album.id);
  }
  album.updated_at = new Date().toISOString();
}

export const mockGalleryDb = {
  async listAlbums(
    params: AlbumsListParams,
  ): Promise<PaginatedResponse<GalleryAlbum>> {
    await delay();
    const search = params.search?.trim().toLowerCase();
    let rows = albums.filter((album) => {
      if (
        search &&
        !album.title_ar.toLowerCase().includes(search) &&
        !album.title_en.toLowerCase().includes(search)
      )
        return false;
      if (params.status && album.status !== params.status) return false;
      /** Date filters compare against the album creation date. */
      const created = album.created_at.slice(0, 10);
      if (params.date_from && created < params.date_from) return false;
      if (params.date_to && created > params.date_to) return false;
      return true;
    });
    rows = [...rows].sort((a, b) => b.created_at.localeCompare(a.created_at));
    const perPage = params.per_page ?? 10;
    const lastPage = Math.max(1, Math.ceil(rows.length / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = rows.slice(start, start + perPage);
    return {
      data: slice.map((album) => ({ ...album })),
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total: rows.length,
        from: rows.length ? start + 1 : null,
        to: rows.length ? start + slice.length : null,
      },
    };
  },

  async getAlbum(id: number): Promise<GalleryAlbum> {
    await delay();
    return { ...findAlbum(id) };
  },

  async createAlbum(input: AlbumInput): Promise<GalleryAlbum> {
    await delay();
    const now = new Date().toISOString();
    const album: GalleryAlbum = {
      id: ++nextAlbumId,
      title_ar: input.title_ar,
      title_en: input.title_en,
      description_ar: input.description_ar,
      description_en: input.description_en,
      status: input.status,
      cover_image_url: input.cover_image
        ? await fileToDataUrl(input.cover_image)
        : null,
      images_count: 0,
      created_at: now,
      updated_at: now,
    };
    if (input.cover_image) customCoverAlbumIds.add(album.id);
    albums.unshift(album);
    return { ...album };
  },

  async updateAlbum(id: number, input: AlbumInput): Promise<GalleryAlbum> {
    await delay();
    const album = findAlbum(id);
    await applyAlbumInput(album, input);
    return { ...album };
  },

  async setAlbumStatus(
    id: number,
    status: AlbumStatus,
  ): Promise<GalleryAlbum> {
    await delay();
    const album = findAlbum(id);
    album.status = status;
    album.updated_at = new Date().toISOString();
    return { ...album };
  },

  async deleteAlbum(id: number): Promise<void> {
    await delay();
    const index = albums.findIndex((a) => a.id === id);
    if (index === -1) throw new Error('Album not found');
    albums.splice(index, 1);
    customCoverAlbumIds.delete(id);
    for (let i = images.length - 1; i >= 0; i--) {
      if (images[i].album_id === id) images.splice(i, 1);
    }
  },

  async listImages(albumId: number): Promise<GalleryImage[]> {
    await delay();
    findAlbum(albumId);
    return images
      .filter((img) => img.album_id === albumId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((img) => ({ ...img }));
  },

  async uploadImages(
    albumId: number,
    items: UploadImageItem[],
    onProgress?: (percent: number) => void,
  ): Promise<GalleryImage[]> {
    const album = findAlbum(albumId);
    const created: GalleryImage[] = [];
    /** Simulates axios onUploadProgress in steps per file. */
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const url = await fileToDataUrl(item.file);
      await delay(250);
      const now = new Date().toISOString();
      const image: GalleryImage = {
        id: ++nextImageId,
        album_id: albumId,
        url,
        title_ar: '',
        title_en: '',
        alt_ar: item.alt_ar,
        alt_en: item.alt_en,
        caption_ar: '',
        caption_en: '',
        is_cover: false,
        created_at: now,
        updated_at: now,
      };
      images.push(image);
      created.push({ ...image });
      onProgress?.(Math.round(((i + 1) / items.length) * 100));
    }
    album.images_count += items.length;
    /** Only an album without any cover adopts the first upload as cover. */
    if (!album.cover_image_url && created.length) {
      album.cover_image_url = created[0].url;
      const first = findImage(created[0].id);
      first.is_cover = true;
      customCoverAlbumIds.delete(albumId);
    }
    album.updated_at = new Date().toISOString();
    return created;
  },

  async updateImage(
    id: number,
    input: ImageMetadataInput,
  ): Promise<GalleryImage> {
    await delay();
    const image = findImage(id);
    image.title_ar = input.title_ar;
    image.title_en = input.title_en;
    image.alt_ar = input.alt_ar;
    image.alt_en = input.alt_en;
    image.caption_ar = input.caption_ar;
    image.caption_en = input.caption_en;
    if (input.image) {
      image.url = await fileToDataUrl(input.image);
      /** Replacing the cover image also refreshes the album cover. */
      if (image.is_cover) {
        findAlbum(image.album_id).cover_image_url = image.url;
      }
    }
    image.updated_at = new Date().toISOString();
    return { ...image };
  },

  async deleteImage(id: number): Promise<void> {
    await delay();
    const index = images.findIndex((img) => img.id === id);
    if (index === -1) throw new Error('Image not found');
    const [removed] = images.splice(index, 1);
    const album = findAlbum(removed.album_id);
    album.images_count = Math.max(0, album.images_count - 1);
    /**
     * Deleting the image-backed cover promotes the first remaining image.
     * A custom (standalone-uploaded) cover is never touched here: when it
     * exists, no image carries `is_cover`, so this branch cannot run.
     */
    if (removed.is_cover && !customCoverAlbumIds.has(album.id)) {
      const next = images.find((img) => img.album_id === removed.album_id);
      if (next) {
        next.is_cover = true;
        album.cover_image_url = next.url;
      } else {
        album.cover_image_url = null;
      }
    }
    album.updated_at = new Date().toISOString();
  },

  async setAsCover(id: number): Promise<GalleryImage> {
    await delay();
    const image = findImage(id);
    for (const img of images) {
      if (img.album_id === image.album_id) img.is_cover = false;
    }
    image.is_cover = true;
    const album = findAlbum(image.album_id);
    /** An explicit set-cover replaces any custom cover by user intent. */
    customCoverAlbumIds.delete(album.id);
    album.cover_image_url = image.url;
    album.updated_at = new Date().toISOString();
    image.updated_at = album.updated_at;
    return { ...image };
  },
};
