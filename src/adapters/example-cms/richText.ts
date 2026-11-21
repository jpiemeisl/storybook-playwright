/*
 * Converts the example CMS's rich-text node tree into sanitized HTML.
 *
 * Allow-list by construction: only these nodes produce markup (paragraphs, h2-h4, bold, italic, links,
 * ordered/unordered lists, blockquotes). All text is HTML-escaped; link targets must pass isSafeHref
 * (otherwise the link text is kept without the link). Every other node type is dropped, children
 * included, so unexpected embeds never reach the page.
 */
import { isSafeHref } from '../../registry/links';
import type { CmsRichText, CmsRichTextNode } from './types';

export function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const BLOCK_TAGS: Record<string, string> = {
  paragraph: 'p',
  heading_2: 'h2',
  heading_3: 'h3',
  heading_4: 'h4',
  unordered_list: 'ul',
  ordered_list: 'ol',
  list_item: 'li',
  blockquote: 'blockquote',
};

function children(node: { content?: CmsRichTextNode[] }): string {
  return (node.content ?? []).map(nodeToHtml).join('');
}

function nodeToHtml(node: CmsRichTextNode): string {
  if (node.node_type === 'text') {
    let html = escapeHtml(String(node.value ?? ''));
    const marks = 'marks' in node && Array.isArray(node.marks) ? node.marks : [];
    if (marks.includes('italic')) html = `<em>${html}</em>`;
    if (marks.includes('bold')) html = `<strong>${html}</strong>`;
    return html;
  }
  if (node.node_type === 'hyperlink') {
    const url = 'url' in node ? node.url : undefined;
    const inner = children(node);
    return isSafeHref(url) ? `<a href="${escapeHtml(url)}">${inner}</a>` : inner;
  }
  // The catch-all member of the union defeats narrowing here; every remaining node may have content.
  const container = node as { node_type: string; content?: CmsRichTextNode[] };
  if (container.node_type === 'document') return children(container);
  const tag = BLOCK_TAGS[container.node_type];
  return tag ? `<${tag}>${children(container)}</${tag}>` : '';
}

export function richTextToHtml(nodes: CmsRichText | undefined): string {
  return (nodes ?? []).map(nodeToHtml).join('');
}
