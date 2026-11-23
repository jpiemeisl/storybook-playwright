/*
 * Link and URL safety. Pure functions, shared by the validator, the registry and adapters.
 */

const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:']);

/**
 * True for relative URLs (/path, #fragment, ?query, ./, ../, bare paths) and http(s), mailto: and
 * tel: URLs. False for javascript:, data:, vbscript: and any other scheme, including obfuscated ones
 * such as "java\tscript:" or " JavaScript:" (browsers ignore whitespace and control characters there).
 */
export function isSafeHref(href: unknown): href is string {
  if (typeof href !== 'string') return false;
  // Browsers strip ASCII whitespace and control characters before reading the scheme.
  const normalized = href.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
  if (normalized === '') return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
  if (!scheme) return true; // relative URL
  return ALLOWED_SCHEMES.has(`${scheme[1]}:`);
}

/** Image sources: relative or http(s) only (no data:, blob: or javascript:). */
export function isSafeImageSrc(src: unknown): src is string {
  if (typeof src !== 'string') return false;
  const normalized = src.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
  if (normalized === '') return false;
  const scheme = /^([a-z][a-z0-9+.-]*):/.exec(normalized);
  return !scheme || scheme[1] === 'http' || scheme[1] === 'https';
}

/** Anchor ids usable as #fragments and element ids: a letter, then letters, digits, - or _ (max 64). */
export function isSafeAnchorId(id: unknown): id is string {
  return typeof id === 'string' && /^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(id);
}

/**
 * Defense in depth for adapter-sanitized rich text: removes href/src attributes whose value is not
 * safe, so such links render as inert text. This is NOT a sanitizer; adapters must sanitize first.
 * Returns the cleaned HTML and the list of removed values.
 */
export function neutralizeUnsafeUrls(html: string): { html: string; removed: string[] } {
  const removed: string[] = [];
  const cleaned = html.replace(
    /\s(href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi,
    (match, attribute: string, _quoted, doubleQuoted?: string, singleQuoted?: string, bare?: string) => {
      const value = decodeEntities(doubleQuoted ?? singleQuoted ?? bare ?? '');
      const safe = attribute.toLowerCase() === 'src' ? isSafeImageSrc(value) : isSafeHref(value);
      if (safe) return match;
      removed.push(value);
      return '';
    },
  );
  return { html: cleaned, removed };
}

/**
 * Removes unsafe href/src attributes from adapter-sanitized rich text (the British-spelled name).
 * @deprecated Use neutralizeUnsafeUrls instead.
 */
export function neutraliseUnsafeUrls(html: string): { html: string; removed: string[] } {
  return neutralizeUnsafeUrls(html);
}

/** Decodes the entities an attacker could use to hide a scheme ("&#106;avascript:"). */
function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);?/gi, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, dec: string) => String.fromCharCode(parseInt(dec, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;/gi, '\t')
    .replace(/&newline;/gi, '\n')
    .replace(/&amp;/gi, '&');
}
