/**
 * Minimal SEO helper for public pages: updates document title, meta
 * description, and Open Graph tags in place, and restores the previous
 * values on cleanup so other routes are unaffected.
 */

interface SeoMeta {
  title: string;
  description?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string | null;
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string | null | undefined) {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  const existed = !!tag;
  const hadContent = tag ? tag.hasAttribute('content') : false;
  const previous = tag?.getAttribute('content') ?? null;
  if (content) {
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attr, key);
      document.head.appendChild(tag);
    }
    tag.setAttribute('content', content);
  }
  return { attr, key, previous, existed, hadContent };
}

/** Applies the meta; returns a restore function for effect cleanup. */
export function applySeoMeta(meta: SeoMeta): () => void {
  const previousTitle = document.title;
  document.title = meta.title;

  const records = [
    upsertMeta('name', 'description', meta.description),
    upsertMeta('property', 'og:title', meta.ogTitle ?? meta.title),
    upsertMeta('property', 'og:description', meta.ogDescription ?? meta.description),
    upsertMeta('property', 'og:image', meta.ogImage ?? undefined),
  ];

  return () => {
    document.title = previousTitle;
    records.forEach(({ attr, key, previous, existed, hadContent }) => {
      const tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!tag) return;
      if (!existed) {
        tag.remove();
      } else if (hadContent) {
        tag.setAttribute('content', previous ?? '');
      } else {
        tag.removeAttribute('content');
      }
    });
  };
}
