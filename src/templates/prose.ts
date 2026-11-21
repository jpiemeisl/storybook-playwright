/*
 * Prepares rich-text bodies for templates with a table of contents: adds heading ids (unique across the
 * page) and collects h2/h3 headings. Pure.
 */
import type { TocItem } from '../component-types/content';
import type { Block } from '../content-types/blocks';
import { isSafeAnchorId } from '../registry/links';
import { addHeadingIds, extractHeadings } from './headings';

/** A table of contents is shown only with at least this many headings. */
export const MIN_TOC_HEADINGS = 3;

/** Ids already taken on the page: the main landmark and every block anchorId. */
export function reservedIds(...blockLists: (readonly Block[] | undefined)[]): Set<string> {
  const ids = new Set(['main']);
  for (const list of blockLists) for (const block of list ?? []) if (block.anchorId) ids.add(block.anchorId);
  return ids;
}

function tocFrom(html: string): TocItem[] {
  return extractHeadings(html).flatMap((heading) => (heading.id && isSafeAnchorId(heading.id) ? [{ id: heading.id, label: heading.text, level: heading.level }] : []));
}

/** One HTML document → HTML with heading ids plus its TOC (empty when under MIN_TOC_HEADINGS). */
export function prepareHtml(html: string, used: Set<string>): { html: string; toc: TocItem[] } {
  const withIds = addHeadingIds(html, used);
  const toc = tocFrom(withIds);
  return { html: withIds, toc: toc.length >= MIN_TOC_HEADINGS ? toc : [] };
}

/** A body of blocks: richText blocks get heading ids; the TOC covers all of them in order. */
export function prepareBody(blocks: readonly Block[], used: Set<string>): { blocks: Block[]; toc: TocItem[] } {
  const toc: TocItem[] = [];
  const prepared = blocks.map((block) => {
    if (block.type !== 'richText' || block.content?.format !== 'html' || typeof block.content.html !== 'string') return block;
    const html = addHeadingIds(block.content.html, used);
    toc.push(...tocFrom(html));
    return { ...block, content: { ...block.content, html } };
  });
  return { blocks: prepared, toc: toc.length >= MIN_TOC_HEADINGS ? toc : [] };
}
