/**
 * Temporary in-memory news store emulating Laravel server-side filtering,
 * pagination, and image storage (data URLs stand in for storage paths).
 * Deleted once the API exists.
 */
import type {
  NewsArticle,
  NewsCategorySlug,
  NewsInput,
  NewsListParams,
  NewsStatus,
  PaginatedResponse,
} from '../adminNews';

const CATEGORY_CYCLE: NewsCategorySlug[] = [
  'announcements',
  'activities',
  'programs',
  'press',
];
const AUTHORS = ['فريق مجددون', 'إدارة الإعلام', 'قسم البرامج'];

const AR_TITLES = [
  'انطلاق برنامج التمكين الشبابي الجديد',
  'مجددون تنظم حملة تطوعية في عمّان',
  'توقيع اتفاقية شراكة مع مؤسسة محلية',
  'ورشة تدريبية حول المهارات القيادية',
  'إطلاق مبادرة دعم الأسر المحتاجة',
  'اختتام فعاليات المخيم الصيفي',
  'لقاء تعريفي للمتطوعين الجدد',
  'حملة توعوية في المدارس الحكومية',
];
const EN_TITLES = [
  'Launch of the New Youth Empowerment Program',
  'Mujaddidun Organizes a Volunteer Campaign in Amman',
  'Partnership Agreement Signed with a Local Organization',
  'Training Workshop on Leadership Skills',
  'Launch of the Family Support Initiative',
  'Closing of the Summer Camp Activities',
  'Orientation Meeting for New Volunteers',
  'Awareness Campaign in Public Schools',
];

function paragraph(ar: boolean, title: string): string {
  const body = ar
    ? `<h2>${title}</h2><p>ضمن جهودها المستمرة لخدمة المجتمع، أعلنت منصة مجددون عن هذه الفعالية التي تأتي في إطار رؤيتها لتمكين الشباب وتعزيز العمل التطوعي.</p><p>وشهدت الفعالية مشاركة واسعة من المتطوعين والشركاء، حيث تم تنفيذ مجموعة من الأنشطة المتنوعة التي لاقت تفاعلًا كبيرًا.</p><ul><li>تنظيم ورش عمل متخصصة</li><li>مشاركة أكثر من 50 متطوعًا</li><li>تعاون مع شركاء محليين</li></ul><p>وتؤكد المنصة استمرارها في تنفيذ مثل هذه المبادرات خلال الفترة المقبلة.</p>`
    : `<h2>${title}</h2><p>As part of its ongoing community efforts, the Mujaddidun platform announced this activity within its vision of empowering youth and promoting volunteerism.</p><p>The activity saw wide participation from volunteers and partners, with a variety of programs that received great engagement.</p><ul><li>Specialized workshops</li><li>More than 50 participating volunteers</li><li>Cooperation with local partners</li></ul><p>The platform confirms it will continue delivering such initiatives in the coming period.</p>`;
  return body;
}

function buildArticles(): NewsArticle[] {
  const items: NewsArticle[] = [];
  for (let i = 1; i <= 23; i++) {
    const idx = i % AR_TITLES.length;
    const created = new Date(Date.UTC(2026, 0, 3) + i * 9 * 86_400_000);
    const status: NewsStatus =
      i % 7 === 0 ? 'archived' : i % 3 === 0 ? 'draft' : 'published';
    items.push({
      id: i + 500,
      title_ar: `${AR_TITLES[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      title_en: `${EN_TITLES[idx]} ${i > 8 ? `(${i})` : ''}`.trim(),
      excerpt_ar:
        'ملخص قصير للخبر يوضح أهم النقاط الواردة فيه ويشجع القارئ على متابعة التفاصيل.',
      excerpt_en:
        'A short summary of the article highlighting its key points and inviting the reader to learn more.',
      content_ar: paragraph(true, AR_TITLES[idx]),
      content_en: paragraph(false, EN_TITLES[idx]),
      category: CATEGORY_CYCLE[i % CATEGORY_CYCLE.length],
      author: AUTHORS[i % AUTHORS.length],
      status,
      featured_image_url: null,
      published_at:
        status === 'published'
          ? new Date(created.getTime() + 86_400_000).toISOString()
          : null,
      created_at: created.toISOString(),
      updated_at: new Date(created.getTime() + i * 3_600_000).toISOString(),
    });
  }
  return items.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

let articles = buildArticles();
let nextId = 600;

const DELAY_MS = 300;
const delay = () => new Promise((r) => setTimeout(r, DELAY_MS));

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function matches(article: NewsArticle, params: NewsListParams): boolean {
  if (params.search) {
    const q = params.search.trim().toLowerCase();
    if (
      !article.title_ar.toLowerCase().includes(q) &&
      !article.title_en.toLowerCase().includes(q)
    )
      return false;
  }
  if (params.category && article.category !== params.category) return false;
  if (params.status && article.status !== params.status) return false;
  if (params.published_from) {
    if (
      !article.published_at ||
      article.published_at < new Date(params.published_from).toISOString()
    )
      return false;
  }
  if (params.published_to) {
    const end = new Date(params.published_to);
    end.setUTCHours(23, 59, 59, 999);
    if (!article.published_at || article.published_at > end.toISOString())
      return false;
  }
  return true;
}

async function applyInput(
  article: NewsArticle,
  input: NewsInput,
): Promise<void> {
  article.title_ar = input.title_ar;
  article.title_en = input.title_en;
  article.excerpt_ar = input.excerpt_ar;
  article.excerpt_en = input.excerpt_en;
  article.content_ar = input.content_ar;
  article.content_en = input.content_en;
  article.category = input.category;
  article.author = input.author;
  article.status = input.status;
  article.published_at =
    input.status === 'published'
      ? input.published_at ?? new Date().toISOString()
      : input.published_at;
  if (input.remove_featured_image) article.featured_image_url = null;
  if (input.featured_image) {
    article.featured_image_url = await fileToDataUrl(input.featured_image);
  }
  article.updated_at = new Date().toISOString();
}

export const mockNewsDb = {
  async list(
    params: NewsListParams,
  ): Promise<PaginatedResponse<NewsArticle>> {
    await delay();
    const filtered = articles.filter((a) => matches(a, params));
    const perPage = params.per_page ?? 10;
    const lastPage = Math.max(1, Math.ceil(filtered.length / perPage));
    const page = Math.min(Math.max(params.page ?? 1, 1), lastPage);
    const start = (page - 1) * perPage;
    const slice = filtered.slice(start, start + perPage);
    return {
      data: slice.map((a) => ({ ...a })),
      meta: {
        current_page: page,
        last_page: lastPage,
        per_page: perPage,
        total: filtered.length,
        from: slice.length ? start + 1 : null,
        to: slice.length ? start + slice.length : null,
      },
    };
  },

  async get(id: number): Promise<NewsArticle> {
    await delay();
    const article = articles.find((a) => a.id === id);
    if (!article) throw new Error('Article not found');
    return { ...article };
  },

  async create(input: NewsInput): Promise<NewsArticle> {
    await delay();
    const now = new Date().toISOString();
    const article: NewsArticle = {
      id: nextId++,
      title_ar: '',
      title_en: '',
      excerpt_ar: '',
      excerpt_en: '',
      content_ar: '',
      content_en: '',
      category: 'announcements',
      author: '',
      status: 'draft',
      featured_image_url: null,
      published_at: null,
      created_at: now,
      updated_at: now,
    };
    await applyInput(article, input);
    articles = [article, ...articles];
    return { ...article };
  },

  async update(id: number, input: NewsInput): Promise<NewsArticle> {
    await delay();
    const article = articles.find((a) => a.id === id);
    if (!article) throw new Error('Article not found');
    await applyInput(article, input);
    return { ...article };
  },

  async setStatus(id: number, status: NewsStatus): Promise<NewsArticle> {
    await delay();
    const article = articles.find((a) => a.id === id);
    if (!article) throw new Error('Article not found');
    article.status = status;
    if (status === 'published' && !article.published_at) {
      article.published_at = new Date().toISOString();
    }
    article.updated_at = new Date().toISOString();
    return { ...article };
  },

  async remove(id: number): Promise<void> {
    await delay();
    articles = articles.filter((a) => a.id !== id);
  },
};
