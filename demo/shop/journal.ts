/*
 * DEMO ONLY. The shop's journal (blog), plus the in-memory search over products and posts. Plain data
 * in the content model's page shapes.
 */
import type { ArticleSummary, BlogIndexPage, BlogPostPage, ErrorPageContent, SearchPage, SearchResult } from '../../src/content-types/templates';
import { catalog } from '../../src/commerce/fixtures';

const author = { name: 'Ana Ruiz', role: 'Head grower', avatar: { src: '/fixtures/images/avatar-ana.svg', alt: '', width: 160, height: 160 } };

interface Post extends ArticleSummary {
  html: string;
}

const posts: Post[] = [
  { id: 'post-seeds', title: 'Sowing calendar for small gardens', href: '/blog/sowing-calendar', excerpt: 'What to sow each month when you only have a few beds.', category: 'Growing', publishedAt: '2026-03-14', readingTime: 4, author, image: { src: '/fixtures/images/gallery/market.svg', alt: '', width: 1200, height: 800 }, html: '<p>Start with what you like to eat. Sow little and often: a short row every two weeks beats one big sowing.</p><h2>Spring</h2><p>Peas, radishes and salad leaves go in as soon as the soil is workable.</p>' },
  { id: 'post-mugs', title: 'Caring for stoneware', href: '/blog/caring-for-stoneware', excerpt: 'Glazed stoneware lasts decades with a little care.', category: 'Home', publishedAt: '2026-02-27', readingTime: 2, author, image: { src: '/fixtures/images/gallery/desk.svg', alt: '', width: 1200, height: 800 }, html: '<p>Stoneware is dishwasher safe, but hand washing keeps the glaze bright. Avoid sudden temperature changes.</p>' },
  { id: 'post-twine', title: 'Five uses for garden twine', href: '/blog/garden-twine', excerpt: 'Beyond tying up tomatoes.', category: 'Growing', publishedAt: '2026-02-11', readingTime: 3, author, image: { src: '/fixtures/images/gallery/harbour.svg', alt: '', width: 1200, height: 800 }, html: '<p>Mark rows, train climbers, bundle herbs for drying, hang labels and tie bean poles into a wigwam.</p>' },
];

const summary = ({ html: _html, ...rest }: Post): ArticleSummary => rest;

export const blogIndexPage: BlogIndexPage = {
  id: 'journal',
  slug: 'blog',
  template: 'blog-index',
  seo: { title: 'Journal' },
  blocks: [],
  heading: { title: 'The Fernhill journal', description: 'Growing notes and care guides.', breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Journal' }] },
  listing: { items: posts.map(summary), categories: [{ id: 'all', label: 'All posts', href: '/blog' }], activeCategoryId: 'all', pagination: { currentPage: 1, totalPages: 1, basePath: '/blog' } },
};

/** The post for a slug, or undefined. */
export function blogPostPage(slug: string): BlogPostPage | undefined {
  const post = posts.find((p) => p.href === `/blog/${slug}`);
  if (!post) return undefined;
  return {
    id: post.id,
    slug: `blog/${slug}`,
    template: 'blog-post',
    seo: { title: post.title },
    blocks: [],
    article: {
      title: post.title,
      excerpt: post.excerpt,
      author,
      publishedAt: post.publishedAt,
      readingTime: post.readingTime,
      breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Journal', href: '/blog' }, { label: post.title }],
      body: [{ id: `${post.id}-body`, type: 'richText', content: { format: 'html', html: post.html } }],
      related: posts.filter((p) => p !== post).map(summary),
    },
  } as BlogPostPage;
}

/** Case-insensitive search over product titles and summaries, and post titles and excerpts. */
export function searchPage(query: string): SearchPage {
  const q = query.trim().toLowerCase();
  const results: SearchResult[] = !q
    ? []
    : [
        ...catalog.products
          .filter((p) => `${p.title} ${p.summary ?? ''}`.toLowerCase().includes(q))
          .map((p) => ({ id: p.id, title: p.title, url: `/products/${p.handle}`, excerpt: p.summary, type: 'Product', trail: [{ label: 'Home', href: '/' }, { label: 'Shop' }] })),
        ...posts.filter((p) => `${p.title} ${p.excerpt}`.toLowerCase().includes(q)).map((p) => ({ id: p.id, title: p.title, url: p.href, excerpt: p.excerpt, type: 'Article', trail: [{ label: 'Home', href: '/' }, { label: 'Journal' }] })),
      ];
  return {
    id: 'search',
    slug: 'search',
    template: 'search',
    seo: { title: q ? `Search: ${query}` : 'Search' },
    blocks: [],
    search: { query, total: results.length, results: results.slice(0, 10), pagination: { currentPage: 1, totalPages: 1, basePath: '/search' }, suggestions: ['mug', 'seed', 'guide'], contactLink: { label: 'Contact us', href: '/contact' } },
  };
}

export const notFoundPage: ErrorPageContent = {
  id: 'not-found',
  slug: '404',
  template: 'error',
  seo: { title: 'Page not found' },
  blocks: [],
  error: { code: 404, title: 'We can’t find that page', message: 'The link may be old, or the page has moved. Try the shop or search.', primaryAction: { label: 'Go to the home page', href: '/' }, secondaryAction: { label: 'Shop all products', href: '/collections/all' }, searchAction: '/search' },
};
