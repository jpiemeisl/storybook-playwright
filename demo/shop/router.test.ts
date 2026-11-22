import { describe, expect, it } from 'vitest';
import { isInternalHref, matchRoute, parseHref } from './router';

describe('demo shop router', () => {
  it('matches static and dynamic routes, ignoring a trailing slash', () => {
    expect(matchRoute('/')).toEqual({ name: 'home' });
    expect(matchRoute('/account/orders/')).toEqual({ name: 'account-orders' });
    expect(matchRoute('/blog/sowing-calendar')).toEqual({ name: 'blog-post', slug: 'sowing-calendar' });
    expect(matchRoute('/collections/garden')).toEqual({ name: 'collection', handle: 'garden' });
    expect(matchRoute('/products/stoneware-mug')).toEqual({ name: 'product', handle: 'stoneware-mug' });
    expect(matchRoute('/account/orders/FH-2101')).toEqual({ name: 'account-order', id: 'FH-2101' });
    expect(matchRoute('/account/subscriptions/sub-a1')).toEqual({ name: 'account-subscription', id: 'sub-a1' });
  });

  it('falls back to not-found', () => {
    expect(matchRoute('/nope')).toEqual({ name: 'not-found' });
    expect(matchRoute('/products/a/b')).toEqual({ name: 'not-found' });
  });

  it('parses the query and drops the hash', () => {
    const location = parseHref('/search?q=mug&q2=#top');
    expect(location.path).toBe('/search');
    expect(location.query.get('q')).toBe('mug');
    expect(location.href).toBe('/search?q=mug&q2=');
    expect(parseHref('/cart').href).toBe('/cart');
  });

  it('treats only single-slash paths as internal', () => {
    expect(isInternalHref('/cart')).toBe(true);
    expect(isInternalHref('//evil.example')).toBe(false);
    expect(isInternalHref('https://example.com')).toBe(false);
    expect(isInternalHref('mailto:a@b.c')).toBe(false);
    expect(isInternalHref('#main')).toBe(false);
    expect(isInternalHref(undefined)).toBe(false);
  });
});
