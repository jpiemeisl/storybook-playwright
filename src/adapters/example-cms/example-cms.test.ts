import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { renderBlocks } from '../../registry/BlockRenderer';
import { defaultRegistry } from '../../registry/registry';
import { validatePage } from '../../registry/validate';
import { mapAction, mapAsset, mapLink, mapPage, mapSection } from './mapPage';
import { escapeHtml, richTextToHtml } from './richText';
import type { CmsRichTextNode, CmsSection, ExampleCmsPage } from './types';

const payloads = Object.fromEntries(
  Object.entries(import.meta.glob<{ default: ExampleCmsPage }>('./fixtures/*.json', { eager: true })).map(([path, mod]) => [
    path.replace(/^.*\/(.+)\.json$/, '$1'),
    mod.default,
  ]),
);

const text = (value: string, ...marks: ('bold' | 'italic')[]): CmsRichTextNode => ({ node_type: 'text', value, ...(marks.length ? { marks } : {}) });
const para = (...content: CmsRichTextNode[]): CmsRichTextNode => ({ node_type: 'paragraph', content });

function payload(name: string): ExampleCmsPage {
  const value = payloads[name];
  if (!value) throw new Error(`Missing payload: ${name}`);
  return value;
}

describe('richTextToHtml', () => {
  it('escapes text', () => {
    expect(escapeHtml(`<b class="x">&'`)).toBe('&lt;b class=&quot;x&quot;&gt;&amp;&#39;');
    expect(richTextToHtml([para(text('<script>alert(1)</script>'))])).toBe('<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>');
  });

  it('supports paragraphs, headings, marks, lists and quotes', () => {
    const html = richTextToHtml([
      { node_type: 'heading_2', content: [text('Title')] },
      para(text('a '), text('bold', 'bold'), text(' '), text('both', 'bold', 'italic')),
      { node_type: 'ordered_list', content: [{ node_type: 'list_item', content: [para(text('one'))] }] },
      { node_type: 'blockquote', content: [para(text('quote'))] },
    ]);
    expect(html).toBe('<h2>Title</h2><p>a <strong>bold</strong> <strong><em>both</em></strong></p><ol><li><p>one</p></li></ol><blockquote><p>quote</p></blockquote>');
  });

  it('keeps safe links, escapes their URLs and drops unsafe ones (keeping the text)', () => {
    expect(richTextToHtml([para({ node_type: 'hyperlink', url: '/a?x=1&y="2"', content: [text('ok')] })])).toBe('<p><a href="/a?x=1&amp;y=&quot;2&quot;">ok</a></p>');
    expect(richTextToHtml([para({ node_type: 'hyperlink', url: ' javascript:alert(1)', content: [text('bad')] })])).toBe('<p>bad</p>');
    expect(richTextToHtml([para({ node_type: 'hyperlink', url: 'data:text/html,x', content: [text('bad')] })])).toBe('<p>bad</p>');
  });

  it('drops unknown nodes and their children', () => {
    expect(richTextToHtml([{ node_type: 'embedded_entry', content: [text('secret')] }, para(text('kept'))])).toBe('<p>kept</p>');
    expect(richTextToHtml(undefined)).toBe('');
  });
});

describe('field mappers', () => {
  it('maps assets with the title as alt text', () => {
    expect(mapAsset({ asset: { url: '/a.svg', title: 'Alt', width: 10, height: 5 } })).toEqual({ src: '/a.svg', alt: 'Alt', width: 10, height: 5 });
    expect(mapAsset({ asset: { url: '/a.svg' } })?.alt).toBe('');
    expect(mapAsset(undefined)).toBeUndefined();
  });

  it('maps links and actions', () => {
    expect(mapLink({ label: 'Go', url: '/go', open_in_new_tab: true })).toEqual({ label: 'Go', href: '/go', external: true });
    expect(mapLink({ label: '', url: '/go' })).toBeUndefined();
    expect(mapAction({ label: 'Go', url: '/go', style: 'link' })).toEqual({ label: 'Go', href: '/go', variant: 'ghost' });
    expect(mapAction({ label: 'Go', url: '/go' })).toEqual({ label: 'Go', href: '/go' });
  });

  it('reports and skips unknown section types', () => {
    const unmapped: string[] = [];
    const section = { sys: { id: 's1', content_type: 'instagram_feed' }, fields: {} } as unknown as CmsSection;
    expect(mapSection(section, { onUnmapped: (s) => unmapped.push(`${s.id}:${s.contentType}`) })).toBeUndefined();
    expect(unmapped).toEqual(['s1:instagram_feed']);
  });
});

describe('example CMS payloads (contract)', () => {
  it('there are example payloads', () => {
    expect(Object.keys(payloads).length).toBeGreaterThanOrEqual(3);
  });

  it.each(Object.keys(payloads))('%s maps to a page that validates and renders with zero errors', (name) => {
    const unmapped: string[] = [];
    const page = mapPage(payload(name), { onUnmapped: (s) => unmapped.push(s.contentType) });
    expect(validatePage(page).filter((issue) => issue.severity === 'error')).toEqual([]);
    const { nodes, issues } = renderBlocks(page.blocks, { registry: defaultRegistry, context: {}, showErrors: true });
    renderToStaticMarkup(createElement('div', null, ...nodes));
    expect(issues).toEqual([]);
    expect(JSON.parse(JSON.stringify(page))).toEqual(page);
    // Only the deliberately unsupported section in about.json is skipped.
    expect(unmapped).toEqual(name === 'about' ? ['instagram_feed'] : []);
  });

  it('maps the home payload to the expected block types and fields', () => {
    const page = mapPage(payload('home'));
    expect(page.slug).toBe('');
    expect(page.template).toBe('landing');
    expect(page.blocks.map((b) => b.type)).toEqual(['hero', 'featureGrid', 'stats', 'testimonialGrid', 'ctaBanner']);
    expect(page.blocks[0]).toMatchObject({ id: 'cms-hero', headline: 'Bookkeeping that keeps up with your business', variant: 'split' });
  });

  it('removes the unsafe rich-text link in the guide payload', () => {
    const body = mapPage(payload('guide')).blocks.find((b) => b.type === 'richText');
    expect(body && 'content' in body && body.content.html).toContain('<a href="/guides/accruals">guide to accruals</a>');
    expect(JSON.stringify(body)).not.toMatch(/javascript:/);
    expect(JSON.stringify(body)).not.toMatch(/Dropped/);
  });
});
