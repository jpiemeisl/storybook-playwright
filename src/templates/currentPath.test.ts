import { describe, expect, it } from 'vitest';
import type { NavItem } from '../content-types/navigation';
import { markCurrent, matchesPath, normalisePath } from './currentPath';

describe('normalisePath', () => {
  it('drops query, fragment and trailing slashes', () => {
    expect(normalisePath('/blog/?page=2#top')).toBe('/blog');
    expect(normalisePath('/')).toBe('/');
    expect(normalisePath('')).toBe('/');
    expect(normalisePath('about')).toBe('/about');
  });
});

describe('matchesPath', () => {
  it('exact mode matches the same path only', () => {
    expect(matchesPath('/blog', '/blog/')).toBe(true);
    expect(matchesPath('/blog', '/blog/post', 'exact')).toBe(false);
  });

  it('prefix mode matches whole segments', () => {
    expect(matchesPath('/blog', '/blog/post', 'prefix')).toBe(true);
    expect(matchesPath('/blog', '/blogger', 'prefix')).toBe(false);
  });

  it('the home link only matches the home page', () => {
    expect(matchesPath('/', '/about', 'prefix')).toBe(false);
    expect(matchesPath('/', '/', 'prefix')).toBe(true);
  });

  it('never matches external links or fragments', () => {
    expect(matchesPath('https://example.com/blog', '/blog', 'prefix')).toBe(false);
    expect(matchesPath('//example.com/blog', '/blog')).toBe(false);
    expect(matchesPath('mailto:a@b.c', '/')).toBe(false);
    expect(matchesPath('#team', '/')).toBe(false);
  });
});

describe('markCurrent', () => {
  const nav: NavItem[] = [
    { label: 'Services', href: '/services', children: [{ label: 'Payroll', href: '/services/payroll' }] },
    { label: 'Blog', href: '/blog', current: true },
    { label: 'Home', href: '/' },
  ];
  const currentOf = (items: NavItem[]): string[] =>
    items.flatMap((item) => [...(item.current ? [item.label] : []), ...currentOf(item.children ?? [])]);

  it('marks the exact match, including children', () => {
    expect(currentOf(markCurrent(nav, '/services/payroll'))).toEqual(['Payroll']);
  });

  it('falls back to the deepest ancestor in prefix mode', () => {
    expect(currentOf(markCurrent(nav, '/services/payroll/faq'))).toEqual(['Payroll']);
    expect(currentOf(markCurrent(nav, '/blog/five-day-close'))).toEqual(['Blog']);
  });

  it('marks nothing in exact mode without an exact match', () => {
    expect(currentOf(markCurrent(nav, '/blog/five-day-close', 'exact'))).toEqual([]);
  });

  it('replaces current flags already in the data', () => {
    expect(currentOf(markCurrent(nav, '/'))).toEqual(['Home']);
  });

  it('returns items unchanged without a current path, and never mutates them', () => {
    expect(markCurrent(nav, undefined)).toBe(nav);
    markCurrent(nav, '/');
    expect(nav[1]?.current).toBe(true);
  });
});
