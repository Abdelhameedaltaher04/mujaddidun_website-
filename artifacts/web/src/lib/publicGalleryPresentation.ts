/** Locale-aware presentation helpers for the public gallery. */
import type { PublicGalleryAlbum, PublicGalleryImage } from '@/services/publicGallery';

type Lang = 'ar' | 'en';

export function albumTitle(album: PublicGalleryAlbum, lang: Lang): string {
  return (lang === 'ar' ? album.title_ar : album.title_en) || album.title_ar;
}

export function albumDescription(album: PublicGalleryAlbum, lang: Lang): string {
  return (lang === 'ar' ? album.description_ar : album.description_en) || '';
}

export function imageAlt(image: PublicGalleryImage, lang: Lang): string {
  return (
    (lang === 'ar' ? image.alt_ar : image.alt_en) ||
    image.alt_ar ||
    (lang === 'ar' ? image.title_ar : image.title_en) ||
    ''
  );
}

export function imageCaption(image: PublicGalleryImage, lang: Lang): string {
  return (lang === 'ar' ? image.caption_ar : image.caption_en) || '';
}
