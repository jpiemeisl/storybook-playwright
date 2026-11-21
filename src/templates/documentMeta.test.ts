import { describe, expect, it } from 'vitest';
import { getDocumentMeta } from './documentMeta';

describe('getDocumentMeta', () => {
  it('returns raw title and description, without title templating', () => {
    expect(getDocumentMeta({ seo: { title: 'Pricing', description: 'Plans from $0.' } })).toEqual({
      title: 'Pricing',
      description: 'Plans from $0.',
      openGraph: { title: 'Pricing', description: 'Plans from $0.', type: 'website' },
    });
  });

  it('maps canonical, noindex and the social image', () => {
    const meta = getDocumentMeta({
      template: 'blog-post',
      seo: { title: 'Post', canonicalUrl: 'https://brightside.example/blog/post', noindex: true, ogImage: { src: '/og.png', alt: 'A desk', width: 1200, height: 630 } },
    });
    expect(meta.canonical).toBe('https://brightside.example/blog/post');
    expect(meta.robots).toBe('noindex');
    expect(meta.openGraph).toEqual({
      title: 'Post',
      url: 'https://brightside.example/blog/post',
      type: 'article',
      image: { url: '/og.png', alt: 'A desk', width: 1200, height: 630 },
    });
  });

  it('drops relative or unsafe canonical URLs and unsafe images', () => {
    const meta = getDocumentMeta({ seo: { title: 'X', canonicalUrl: 'javascript:alert(1)', ogImage: { src: 'data:image/png;base64,AA', alt: '' } } });
    expect(meta.canonical).toBeUndefined();
    expect(meta.openGraph.image).toBeUndefined();
    expect(getDocumentMeta({ seo: { title: 'X', canonicalUrl: '/relative' } }).canonical).toBeUndefined();
  });
});
