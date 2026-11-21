/*
 * Document <head> values from SeoMeta. The library never touches <head>: host apps (Next.js metadata,
 * react-helmet, server templates) render these. Raw values only; title templates ("… | Site") are the
 * host's concern.
 */
import type { PageContent } from '../content-types/blocks';
import { isSafeImageSrc } from '../registry/links';

export interface DocumentMeta {
  title: string;
  description?: string;
  /** Absolute http(s) canonical URL; other values are dropped. */
  canonical?: string;
  /** "noindex" when the page asks not to be indexed. */
  robots?: string;
  openGraph: {
    title: string;
    description?: string;
    url?: string;
    /** "article" for blog posts and case studies, otherwise "website". */
    type: 'website' | 'article';
    image?: { url: string; alt: string; width?: number; height?: number };
  };
}

const ARTICLE_TEMPLATES = new Set(['blog-post', 'case-study']);

/** Pure: page → head metadata. Unsafe or non-absolute canonical URLs and unsafe image sources are dropped. */
export function getDocumentMeta(page: Pick<PageContent, 'seo' | 'template'>): DocumentMeta {
  const { title, description, canonicalUrl, noindex, ogImage } = page.seo;
  const canonical = typeof canonicalUrl === 'string' && /^https?:\/\/[^\s]+$/i.test(canonicalUrl) ? canonicalUrl : undefined;
  const image = ogImage && isSafeImageSrc(ogImage.src) ? { url: ogImage.src, alt: ogImage.alt ?? '', width: ogImage.width, height: ogImage.height } : undefined;
  return {
    title,
    ...(description ? { description } : {}),
    ...(canonical ? { canonical } : {}),
    ...(noindex ? { robots: 'noindex' } : {}),
    openGraph: {
      title,
      ...(description ? { description } : {}),
      ...(canonical ? { url: canonical } : {}),
      type: page.template && ARTICLE_TEMPLATES.has(page.template) ? 'article' : 'website',
      ...(image ? { image } : {}),
    },
  };
}
