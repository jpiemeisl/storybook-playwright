import { describe, expect, it } from 'vitest';
import { isSafeAnchorId, isSafeHref, isSafeImageSrc, neutraliseUnsafeUrls, neutralizeUnsafeUrls } from './links';

describe('isSafeHref', () => {
  it.each(['/about', '#pricing', '?page=2', './a', '../b', 'contact', 'https://example.com', 'http://x.test', 'mailto:hi@x.test', 'tel:+15550100'])(
    'allows %s',
    (href) => expect(isSafeHref(href)).toBe(true),
  );

  it.each([
    'javascript:alert(1)',
    'JavaScript:alert(1)',
    ' javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox',
    'file:///etc/passwd',
    'ftp://x.test',
    '',
  ])('refuses %j', (href) => expect(isSafeHref(href)).toBe(false));

  it('refuses non-strings', () => {
    expect(isSafeHref(undefined)).toBe(false);
    expect(isSafeHref(42)).toBe(false);
  });
});

describe('isSafeImageSrc', () => {
  it('allows relative and http(s)', () => {
    expect(isSafeImageSrc('/fixtures/images/a.svg')).toBe(true);
    expect(isSafeImageSrc('https://cdn.test/a.jpg')).toBe(true);
  });
  it('refuses data:, blob: and javascript:', () => {
    expect(isSafeImageSrc('data:image/png;base64,AAA')).toBe(false);
    expect(isSafeImageSrc('blob:https://x.test/1')).toBe(false);
    expect(isSafeImageSrc('javascript:alert(1)')).toBe(false);
  });
});

describe('isSafeAnchorId', () => {
  it.each(['pricing', 'faq-2', 'Team_Section'])('allows %s', (id) => expect(isSafeAnchorId(id)).toBe(true));
  it.each(['2fast', 'has space', 'a"b', '<x>', '', 'a'.repeat(65)])('refuses %j', (id) => expect(isSafeAnchorId(id)).toBe(false));
});

describe('neutralizeUnsafeUrls', () => {
  it('removes unsafe href values and keeps safe ones', () => {
    const { html, removed } = neutralizeUnsafeUrls('<p><a href="/ok">ok</a> <a href="javascript:alert(1)">bad</a></p>');
    expect(html).toBe('<p><a href="/ok">ok</a> <a>bad</a></p>');
    expect(removed).toEqual(['javascript:alert(1)']);
  });

  it('catches entity-encoded and single-quoted schemes', () => {
    const { html, removed } = neutralizeUnsafeUrls("<a href='&#106;avascript:x'>a</a><a href=\"jav&#x61;script&colon;y\">b</a>");
    expect(html).toBe('<a>a</a><a>b</a>');
    expect(removed).toHaveLength(2);
  });

  it('removes data: image sources', () => {
    expect(neutralizeUnsafeUrls('<img src="data:image/png;base64,AAA" alt="">').html).toBe('<img alt="">');
  });
});

describe('neutraliseUnsafeUrls (deprecated)', () => {
  it('behaves like neutralizeUnsafeUrls', () => {
    const html = '<a href="javascript:x">a</a><a href="/ok">b</a>';
    expect(neutraliseUnsafeUrls(html)).toEqual(neutralizeUnsafeUrls(html));
  });
});
