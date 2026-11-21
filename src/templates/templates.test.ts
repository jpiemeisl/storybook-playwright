/*
 * Template contract tests: registry fallback, template-specific validation, and every template page
 * fixture rendered to static markup through PageRenderer (one h1, no skipped levels, unique ids,
 * TOC links that resolve, a GET search form).
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { PageContent } from '../content-types/blocks';
import type { SiteChrome } from '../content-types/chrome';
import { assignHeadingLevels } from '../registry/headingLevels';
import { renderBlocks } from '../registry/BlockRenderer';
import { defaultRegistry } from '../registry/registry';
import type { ValidationIssue } from '../registry/checker';
import { errorsOnly, validatePage } from '../registry/validate';
import { PageRenderer } from './PageRenderer';
import { createTemplates, defaultTemplates, getTemplate, resolveTemplate } from './registry';
import { defineTemplate } from './types';

const load = <T,>(modules: Record<string, { default: T }>) =>
  Object.fromEntries(Object.entries(modules).map(([path, mod]) => [path.replace(/^.*\/(.+)\.json$/, '$1'), mod.default]));
const pages = load<PageContent>(import.meta.glob('../fixtures/pages/*.json', { eager: true }));
const chromes = load<SiteChrome>(import.meta.glob('../fixtures/chrome/*.json', { eager: true }));
const chrome = chromes.default!;

/** Every fixture that names a template. */
const templatePages = Object.entries(pages).filter(([, page]) => page.template !== undefined);
const page = (name: string) => {
  const found = pages[name];
  if (!found) throw new Error(`Missing fixture ${name}`);
  return structuredClone(found) as PageContent & Record<string, unknown>;
};

const render = (p: PageContent, c: SiteChrome = chrome) => renderToStaticMarkup(createElement(PageRenderer, { page: p, chrome: c, ctx: { currentPath: `/${p.slug}` } }));
const headingLevels = (html: string) => [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
const ids = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]!);
const count = (html: string, pattern: RegExp) => (html.match(pattern) ?? []).length;

describe('templates registry', () => {
  it('every template used by a fixture resolves to a registered template', () => {
    expect(templatePages.length).toBeGreaterThanOrEqual(28);
    for (const [name, p] of templatePages) expect(defaultTemplates[p.template!], name).toBeDefined();
  });

  it('getTemplate falls back to default and reports unknown names', () => {
    const issues: ValidationIssue[] = [];
    expect(getTemplate('nope', defaultTemplates, (issue) => issues.push(issue))).toBe(defaultTemplates.default);
    expect(issues.map((issue) => issue.code)).toEqual(['unknown-template']);
    expect(getTemplate(undefined)).toBe(defaultTemplates.default);
    expect(getTemplate('toString')).toBe(defaultTemplates.default);
    expect(getTemplate('blog-post')).toBe(defaultTemplates['blog-post']);
  });

  it('falls back to default when a page lacks its template data', () => {
    const { definition, issues } = resolveTemplate({ id: 'p', slug: 'x', template: 'blog-post', seo: { title: 'X' }, blocks: [] });
    expect(definition).toBe(defaultTemplates.default);
    expect(issues.map((issue) => issue.code)).toEqual(['missing-field']);
  });

  it('createTemplates adds and replaces templates without touching the defaults', () => {
    const custom = defineTemplate({ name: 'press', label: 'Press', description: 'Press release', component: () => null });
    const legal = defineTemplate({ name: 'legal', label: 'Legal (custom)', description: 'Replaced', component: () => null });
    const templates = createTemplates([custom, legal]);
    expect(templates.press).toBe(custom);
    expect(templates.legal).toBe(legal);
    expect(defaultTemplates.legal).not.toBe(legal);
    expect(defaultTemplates.press).toBeUndefined();
  });
});

describe('h1Provided', () => {
  const blocks = [
    { id: 'h', type: 'pageHeader', title: 'Title' },
    { id: 'f', type: 'faq', heading: 'FAQ', items: [{ question: 'Q?', answer: { format: 'html', html: '<p>A</p>' } }] },
  ] as never[];

  it('assignHeadingLevels gives no block h1 when the template provides it', () => {
    expect(assignHeadingLevels(blocks, defaultRegistry.get)).toEqual([1, 2]);
    expect(assignHeadingLevels(blocks, defaultRegistry.get, { h1Provided: true })).toEqual([2, 2]);
  });

  it('renderBlocks then renders the page header as an h2', () => {
    const html = (h1Provided: boolean) => renderToStaticMarkup(createElement('div', null, ...renderBlocks(blocks, { registry: defaultRegistry, context: {}, showErrors: false, h1Provided }).nodes));
    expect(headingLevels(html(false))[0]).toBe(1);
    expect(headingLevels(html(true))).not.toContain(1);
  });

  it('flow layout renders no sections', () => {
    const html = renderToStaticMarkup(createElement('div', null, ...renderBlocks(blocks, { registry: defaultRegistry, context: {}, showErrors: false, layout: 'flow' }).nodes));
    expect(html).not.toContain('<section');
  });
});

describe.each(templatePages.map(([name]) => name))('fixture %s rendered through PageRenderer', (name) => {
  const html = render(pages[name]!);

  it('validates with zero errors', () => {
    expect(errorsOnly(validatePage(pages[name]))).toEqual([]);
  });

  it('has exactly one h1, first, and no skipped heading levels', () => {
    const levels = headingLevels(html);
    expect(levels.filter((level) => level === 1)).toHaveLength(1);
    expect(levels[0]).toBe(1);
    expect(levels.flatMap((level, i) => (i > 0 && level > levels[i - 1]! + 1 ? [`h${levels[i - 1]}→h${level}`] : []))).toEqual([]);
  });

  it('has one main landmark and unique ids', () => {
    expect(count(html, /<main\b/g)).toBe(1);
    const all = ids(html);
    expect(all.filter((id, i) => all.indexOf(id) !== i)).toEqual([]);
  });

  it('has TOC links that point at existing ids', () => {
    const present = new Set(ids(html));
    const tocLinks = [...html.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]!).filter((id) => id !== 'main');
    expect(tocLinks.filter((id) => !present.has(id))).toEqual([]);
  });

  it('never renders a javascript: or data: URL', () => {
    expect(html).not.toMatch(/(?:href|src|action)="\s*(?:javascript|data):/i);
  });
});

describe('template specifics', () => {
  it('composed pages render a full header and footer; landing and 5xx errors use minimal chrome', () => {
    expect(count(render(pages.home!), /<nav\b/g)).toBeGreaterThan(2);
    for (const name of ['landing', 'error-500']) {
      const html = render(pages[name]!);
      expect(html, name).not.toContain('aria-label="Main"');
      expect(count(html, /<footer\b/g)).toBe(1);
    }
  });

  it('marks the current nav item for the page path', () => {
    expect(render(pages['blog-post']!)).toMatch(/<a[^>]*aria-current="page"[^>]*>Blog<\/a>/);
  });

  it('blog post: TOC with 8+ entries; short post: no TOC', () => {
    expect(count(render(pages['blog-post']!), /href="#(?!main)[^"]+"/g)).toBeGreaterThanOrEqual(16); // wide list + narrow details
    expect(render(pages['blog-post-short']!)).not.toContain('On this page');
  });

  it('search: a GET form with field q, a polite status and pagination links that keep the query', () => {
    const html = render(pages['search-results']!);
    expect(html).toMatch(/<form[^>]*role="search"[^>]*action="\/search"[^>]*method="get"/);
    expect(html).toMatch(/<input[^>]*name="q"[^>]*value="payroll"/);
    expect(html).toMatch(/role="status"[^>]*>Showing 1–10 of 48 results for “payroll”/);
    expect(html).toContain('href="/search?q=payroll&amp;page=2"');
    expect(render(pages['search-no-query']!)).toContain('Enter a search term');
    expect(render(pages['search-no-results']!)).toContain('href="/search?q=tax+deadlines"');
  });

  it('blog index: pagination marks page 2 and the active category', () => {
    const html = render(pages['blog-index']!);
    expect(html).toMatch(/aria-label="Page 2" aria-current="page"|aria-current="page"[^>]*aria-label="Page 2"/);
    expect(html).toMatch(/aria-current="page"[^>]*>All posts/);
    expect(render(pages['blog-index-empty']!)).toContain('No posts in this category yet');
  });

  it('refuses unsafe links in template data and reports them', () => {
    const p = page('blog-index');
    (p.listing as { items: { href: string }[] }).items[0]!.href = 'javascript:alert(1)';
    expect(render(p)).not.toContain('javascript:');
    expect(validatePage(p).map((issue) => `${issue.code}@${issue.path}`)).toContain('unsafe-href@listing.items[0].href');
  });
});

describe('template-specific validation', () => {
  const issuesOf = (p: unknown) => validatePage(p).map((issue) => `${issue.code}@${issue.path}`);

  it('blog-post needs a title, an author name and an ISO publish date', () => {
    const p = page('blog-post');
    const article = p.article as Record<string, unknown>;
    delete article.title;
    article.author = { role: 'x' };
    article.publishedAt = '14/03/2026';
    expect(issuesOf(p)).toEqual(expect.arrayContaining(['missing-field@article.title', 'missing-field@article.author.name', 'invalid-date@article.publishedAt']));
  });

  it('rejects impossible dates', () => {
    const p = page('legal');
    (p.legal as Record<string, unknown>).lastUpdated = '2026-02-30';
    expect(issuesOf(p)).toContain('invalid-date@legal.lastUpdated');
  });

  it('checks pagination sanity', () => {
    const p = page('blog-index');
    const listing = p.listing as { pagination: Record<string, unknown> };
    listing.pagination.currentPage = 5;
    expect(issuesOf(p)).toContain('invalid-pagination@listing.pagination.currentPage');
    listing.pagination.totalPages = 0;
    expect(issuesOf(p)).toContain('invalid-pagination@listing.pagination.totalPages');
    listing.pagination.totalPages = 4;
    listing.pagination.currentPage = 1.5;
    expect(issuesOf(p)).toContain('invalid-pagination@listing.pagination.currentPage');
  });

  it('reports duplicate ids in listings and across body and page blocks', () => {
    const p = page('blog-index');
    const items = (p.listing as { items: { id: string }[] }).items;
    items[1]!.id = items[0]!.id;
    expect(issuesOf(p)).toContain('duplicate-id@listing.items[1].id');
    const post = page('blog-post');
    (post.blocks[0] as { id: string }).id = 'post-body';
    expect(issuesOf(post)).toContain('duplicate-id@blocks[0].id');
  });

  it('validates blocks inside template bodies', () => {
    const p = page('case-study');
    (p.caseStudy as { body: Record<string, unknown>[] }).body.push({ id: 'bad', type: 'hero' });
    expect(issuesOf(p)).toContain('missing-field@caseStudy.body[3].headline');
  });

  it('error pages need a known code and a primary action', () => {
    const p = page('error-404');
    const error = p.error as Record<string, unknown>;
    error.code = 418;
    delete error.primaryAction;
    expect(issuesOf(p)).toEqual(expect.arrayContaining(['invalid-field@error.code', 'missing-field@error.primaryAction']));
  });

  it('search needs a query string and safe result URLs', () => {
    const p = page('search-results');
    const search = p.search as { query?: string; results: { url: string }[] };
    delete search.query;
    search.results[0]!.url = 'data:text/html,hi';
    expect(issuesOf(p)).toEqual(expect.arrayContaining(['missing-field@search.query', 'unsafe-href@search.results[0].url']));
  });

  it('warns about unknown templates and composed pages without an h1 block', () => {
    expect(validatePage({ id: 'p', slug: 'x', template: 'magazine', seo: { title: 'X' }, blocks: [] })).toEqual([expect.objectContaining({ code: 'unknown-template', severity: 'warning' })]);
    expect(validatePage({ id: 'p', slug: 'x', template: 'about', seo: { title: 'X' }, blocks: [] })).toEqual([expect.objectContaining({ code: 'missing-field', path: 'blocks', severity: 'warning' })]);
    expect(validatePage({ id: 'p', slug: 'x', template: 'magazine', seo: { title: 'X' }, blocks: [] }, { knownTemplates: ['magazine'] })).toEqual([]);
  });

  it('flags an active category that is not listed', () => {
    const p = page('blog-index');
    (p.listing as Record<string, unknown>).activeCategoryId = 'missing';
    expect(validatePage(p)).toContainEqual(expect.objectContaining({ path: 'listing.activeCategoryId', severity: 'warning' }));
  });
});
