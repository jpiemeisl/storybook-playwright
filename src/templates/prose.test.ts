import { describe, expect, it } from 'vitest';
import type { Block } from '../content-types/blocks';
import { prepareBody, prepareHtml, reservedIds } from './prose';

const rich = (id: string, html: string): Block => ({ id, type: 'richText', content: { format: 'html', html } });

describe('prepareBody', () => {
  it('adds ids across several rich-text blocks and builds one TOC', () => {
    const { blocks, toc } = prepareBody([rich('a', '<h2>Intro</h2><h3>Detail</h3>'), { id: 'q', type: 'divider' }, rich('b', '<h2>Intro</h2>')], new Set());
    expect(toc).toEqual([
      { id: 'intro', label: 'Intro', level: 2 },
      { id: 'detail', label: 'Detail', level: 3 },
      { id: 'intro-2', label: 'Intro', level: 2 },
    ]);
    expect((blocks[2] as Extract<Block, { type: 'richText' }>).content.html).toBe('<h2 id="intro-2">Intro</h2>');
    expect(blocks[1]).toEqual({ id: 'q', type: 'divider' });
  });

  it('omits the TOC with fewer than three headings', () => {
    expect(prepareBody([rich('a', '<h2>One</h2><h2>Two</h2>')], new Set()).toc).toEqual([]);
  });

  it('never reuses reserved ids (main, block anchors)', () => {
    const used = reservedIds([{ id: 'x', type: 'divider', anchorId: 'faq' }]);
    expect(prepareHtml('<h2>Main</h2><h2>FAQ</h2><h2>Other</h2>', used).toc.map((item) => item.id)).toEqual(['main-2', 'faq-2', 'other']);
  });

  it('leaves unsafe existing ids out of the TOC', () => {
    expect(prepareHtml('<h2 id="has space">A</h2><h2>B</h2><h2>C</h2><h2>D</h2>', new Set()).toc.map((item) => item.id)).toEqual(['b', 'c', 'd']);
  });
});
