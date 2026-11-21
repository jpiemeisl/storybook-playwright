import { describe, expect, it } from 'vitest';
import type { PageContent } from '../content-types/blocks';
import { errorsOnly, isFatal, validateBlock, validatePage } from './validate';

const codes = (issues: { code: string }[]) => issues.map((issue) => issue.code);

describe('validateBlock', () => {
  it('accepts a minimal valid block', () => {
    expect(validateBlock({ id: 'h', type: 'hero', headline: 'Hello' })).toEqual([]);
  });

  it('reports a missing required field as fatal, with block id and type', () => {
    const issues = validateBlock({ id: 'h1', type: 'hero' });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({ code: 'missing-field', path: 'headline', blockId: 'h1', blockType: 'hero' });
    expect(isFatal(issues[0]!)).toBe(true);
  });

  it('reports unknown types unless listed in knownTypes', () => {
    expect(codes(validateBlock({ id: 'x', type: 'carouselOfDoom' }))).toEqual(['unknown-type']);
    expect(validateBlock({ id: 'x', type: 'carouselOfDoom' }, { knownTypes: ['carouselOfDoom'] })).toEqual([]);
  });

  it('flags unsafe links as non-fatal', () => {
    const issues = validateBlock({ id: 'c', type: 'ctaBanner', heading: 'Go', primaryAction: { label: 'Click', href: 'javascript:alert(1)' } });
    expect(codes(issues)).toEqual(['unsafe-href']);
    expect(isFatal(issues[0]!)).toBe(false);
  });

  it('flags missing alt text and unsafe image sources', () => {
    const issues = validateBlock({ id: 'm', type: 'mediaText', heading: 'Hi', media: { src: 'data:image/png;base64,AA' } });
    expect(codes(issues).sort()).toEqual(['missing-alt', 'unsafe-src']);
  });

  it('flags unsafe anchor ids', () => {
    expect(codes(validateBlock({ id: 'd', type: 'divider', anchorId: 'bad id"' }))).toEqual(['unsafe-anchor']);
  });

  it('checks array lengths: too few is fatal, too many is a warning', () => {
    expect(codes(validateBlock({ id: 's', type: 'stats', items: [{ value: '1', label: 'a' }] }))).toEqual(['too-few']);
    const many = validateBlock({ id: 't', type: 'testimonialGrid', items: Array.from({ length: 4 }, () => ({ quote: 'q', author: { name: 'n' } })) });
    expect(many.map((i) => [i.code, i.severity])).toEqual([['too-many', 'warning']]);
  });

  it('rejects invalid enum values', () => {
    expect(codes(validateBlock({ id: 'h', type: 'hero', headline: 'x', variant: 'giant' }))).toEqual(['invalid-field']);
  });

  it('rejects tabs nested inside tabs, and validates nested blocks', () => {
    const issues = validateBlock({
      id: 't',
      type: 'tabs',
      label: 'Details',
      tabs: [
        { id: 'a', label: 'A', blocks: [{ id: 'inner', type: 'tabs', label: 'x', tabs: [] }] },
        { id: 'b', label: 'B', blocks: [{ id: 'h2', type: 'hero' }] },
      ],
    });
    expect(codes(issues)).toEqual(['nested-tabs', 'missing-field']);
    expect(issues[1]!.path).toBe('tabs[1].blocks[0].headline');
  });

  it('requires a videoId for YouTube and a safe src for generic embeds', () => {
    expect(codes(validateBlock({ id: 'v', type: 'videoEmbed', provider: 'youtube', title: 't' }))).toEqual(['missing-field']);
    expect(codes(validateBlock({ id: 'v', type: 'videoEmbed', provider: 'generic', title: 't', src: 'javascript:x' }))).toEqual(['unsafe-href']);
  });

  it('never throws on garbage input', () => {
    for (const input of [null, 42, 'x', [], { type: 'hero', items: 'nope' }, { id: 1, type: 2 }]) {
      expect(() => validateBlock(input)).not.toThrow();
    }
  });
});

describe('validatePage', () => {
  const page = (blocks: unknown[]): PageContent => ({ id: 'p', slug: 'test', seo: { title: 'Test' }, blocks: blocks as PageContent['blocks'] });

  it('accepts an empty page', () => {
    expect(validatePage(page([]))).toEqual([]);
  });

  it('requires id, slug and seo.title', () => {
    expect(codes(validatePage({ blocks: [] }))).toEqual(['missing-field', 'missing-field', 'missing-field']);
  });

  it('detects duplicate block ids, including inside tabs', () => {
    const issues = validatePage(
      page([
        { id: 'a', type: 'divider' },
        { id: 'a', type: 'divider' },
        { id: 't', type: 'tabs', label: 'x', tabs: [{ id: '1', label: '1', blocks: [{ id: 'a', type: 'divider' }] }, { id: '2', label: '2', richText: { format: 'html', html: '' } }] },
      ]),
    );
    expect(errorsOnly(issues).map((i) => [i.code, i.path])).toEqual([
      ['duplicate-id', 'blocks[1].id'],
      ['duplicate-id', 'blocks[2].tabs[0].blocks[0].id'],
    ]);
  });

  it('detects duplicate anchor ids', () => {
    const issues = validatePage(page([{ id: 'a', type: 'divider', anchorId: 'x' }, { id: 'b', type: 'divider', anchorId: 'x' }]));
    expect(codes(issues)).toEqual(['duplicate-id']);
  });

  it('reports block issues with their page path', () => {
    const [issue] = validatePage(page([{ id: 'ok', type: 'divider' }, { id: 'bad', type: 'hero' }]));
    expect(issue).toMatchObject({ path: 'blocks[1].headline', blockId: 'bad' });
  });
});
