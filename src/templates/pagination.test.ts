import { describe, expect, it } from 'vitest';
import { listPageHref, searchPageHref } from './pagination';

describe('listPageHref', () => {
  it('uses the base path for page 1 and /page/n after', () => {
    expect(listPageHref('/blog', 1)).toBe('/blog');
    expect(listPageHref('/blog/', 3)).toBe('/blog/page/3');
    expect(listPageHref('/', 2)).toBe('/page/2');
  });
});

describe('searchPageHref', () => {
  it('keeps the query and adds the page after page 1', () => {
    expect(searchPageHref('/search', 'tax & payroll', 1)).toBe('/search?q=tax+%26+payroll');
    expect(searchPageHref('/search', 'vat', 4)).toBe('/search?q=vat&page=4');
  });
});
