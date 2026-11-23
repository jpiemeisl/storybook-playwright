/*
 * Heading helpers for rich-text bodies (blog post, legal): find h2/h3 headings for a table of
 * contents and give headings stable ids. Hand-written string processing, no DOM, so they run on the
 * server. Both are total: malformed HTML never throws, it just yields fewer headings.
 */

/** An h2 or h3 heading found by extractHeadings: its level, plain text and existing id. */
export interface ExtractedHeading {
  level: 2 | 3;
  /** Text content: inner tags stripped, entities decoded, whitespace collapsed. */
  text: string;
  /** The heading's id attribute, if it has one. */
  id?: string;
}

/** An h1-h6 element with its attributes and inner HTML. Non-greedy, so it stops at the first matching close tag. */
const HEADING = /<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1\s*>/gi;
/**
 * One attribute: its name and optional value. Read in order from the start of the attribute string, so a
 * quoted value (title="a id=b") is consumed whole and its text is never taken for an attribute.
 */
const ATTRIBUTE = /\s*([^\s"'>/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/y;

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', copy: '©', reg: '®' };

/** Decodes numeric and the common named entities; unknown entities are left as written. */
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, entity: string) => {
    if (entity[0] === '#') {
      const code = entity[1] === 'x' || entity[1] === 'X' ? parseInt(entity.slice(2), 16) : parseInt(entity.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED[entity.toLowerCase()] ?? match;
  });
}

/** Inner HTML → readable text. */
function toText(innerHtml: string): string {
  const stripped = innerHtml.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>?/g, '');
  return decodeEntities(stripped).replace(/\s+/g, ' ').trim();
}

/** The value of the first id attribute, if any. Malformed text between attributes is skipped a character at a time. */
function idOf(attributes: string | undefined): string | undefined {
  if (!attributes) return undefined;
  let index = 0;
  while (index < attributes.length) {
    ATTRIBUTE.lastIndex = index;
    const match = ATTRIBUTE.exec(attributes);
    if (!match || match[0].length === 0) {
      index++;
      continue;
    }
    index = ATTRIBUTE.lastIndex;
    if (match[1]?.toLowerCase() !== 'id') continue;
    const id = (match[2] ?? match[3] ?? match[4] ?? '').trim();
    return id ? decodeEntities(id) : undefined;
  }
  return undefined;
}

/** h2 and h3 headings in document order, for a table of contents. Empty headings are skipped. */
export function extractHeadings(html: unknown): ExtractedHeading[] {
  if (typeof html !== 'string') return [];
  const headings: ExtractedHeading[] = [];
  for (const match of html.matchAll(HEADING)) {
    const level = Number(match[1]);
    if (level !== 2 && level !== 3) continue;
    const text = toText(match[3] ?? '');
    if (!text) continue;
    const id = idOf(match[2]);
    headings.push(id ? { level, text, id } : { level, text });
  }
  return headings;
}

/** "Day 1: Reconcile" → "day-1-reconcile". Always a valid fragment: starts with a letter. */
export function slugify(text: string): string {
  const slug = text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  if (!slug) return 'section';
  return /^[a-z]/.test(slug) ? slug : `section-${slug}`;
}

/**
 * Adds a slug id to every h2-h6 that has none, keeping existing ids. Ids are made unique (suffix -2,
 * -3…) across the document, or across several documents when the same `used` set is passed (one set
 * per page, e.g. for a body made of several rich-text blocks). Only the opening tag of headings that
 * lack an id changes; every other byte is preserved.
 */
export function addHeadingIds(html: unknown, used: Set<string> = new Set()): string {
  if (typeof html !== 'string') return '';
  // Existing ids win: reserve them first so generated ids never collide with them.
  for (const match of html.matchAll(HEADING)) {
    const id = idOf(match[2]);
    if (id) used.add(id);
  }
  return html.replace(HEADING, (whole: string, level: string, attributes: string | undefined, inner: string) => {
    if (idOf(attributes) || Number(level) === 1) return whole;
    const base = slugify(toText(inner));
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    const openTagLength = 2 + level.length + (attributes?.length ?? 0) + 1;
    return `<h${level} id="${id}"${attributes ?? ''}>${whole.slice(openTagLength)}`;
  });
}
