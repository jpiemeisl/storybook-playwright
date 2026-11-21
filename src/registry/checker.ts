/*
 * Shared building blocks for the validators: issue types and a small checker bound to one object
 * and path. Pure: no DOM, no React.
 */
import { isSafeHref, isSafeImageSrc, neutraliseUnsafeUrls } from './links';

export type IssueCode =
  | 'unknown-type'
  | 'missing-field'
  | 'invalid-field'
  | 'too-few'
  | 'too-many'
  | 'nested-tabs'
  | 'unsafe-href'
  | 'unsafe-src'
  | 'unsafe-anchor'
  | 'missing-alt'
  | 'duplicate-id'
  | 'render-error'
  | 'unknown-template'
  | 'invalid-date'
  | 'invalid-pagination';

export interface ValidationIssue {
  code: IssueCode;
  severity: 'error' | 'warning';
  /** Readable explanation for authors. */
  message: string;
  /** Path inside the block or page, e.g. "items[2].link.href". */
  path: string;
  blockId?: string;
  blockType?: string;
}

/** Issues that make a block impossible to render; the renderer skips (or placeholders) such blocks. */
export const FATAL_CODES: ReadonlySet<IssueCode> = new Set(['unknown-type', 'missing-field', 'invalid-field', 'too-few', 'nested-tabs', 'render-error']);

export const isFatal = (issue: ValidationIssue) => FATAL_CODES.has(issue.code);

export type Obj = Record<string, unknown>;
export const isObj = (value: unknown): value is Obj => typeof value === 'object' && value !== null && !Array.isArray(value);
export const isNonEmptyString = (value: unknown): value is string => typeof value === 'string' && value.trim() !== '';

/** Small helper bound to one object and path, collecting issues. */
export class Checker {
  constructor(
    readonly target: Obj,
    readonly path: string,
    readonly issues: ValidationIssue[],
    readonly meta: { blockId?: string; blockType?: string },
  ) {}

  at(key: string) {
    return this.path ? `${this.path}.${key}` : key;
  }

  report(code: IssueCode, key: string, message: string, severity: 'error' | 'warning' = 'error') {
    this.issues.push({ code, severity, message, path: this.at(key), ...this.meta });
  }

  str(key: string, required = true) {
    const value = this.target[key];
    if (value === undefined || value === null || value === '') {
      if (required) this.report('missing-field', key, `"${key}" is required.`);
      return;
    }
    if (typeof value !== 'string') this.report('invalid-field', key, `"${key}" must be text.`);
    else if (required && value.trim() === '') this.report('missing-field', key, `"${key}" must not be blank.`);
  }

  num(key: string, required = false) {
    const value = this.target[key];
    if (value === undefined || value === null) {
      if (required) this.report('missing-field', key, `"${key}" is required.`);
      return;
    }
    if (typeof value !== 'number' || !Number.isFinite(value)) this.report('invalid-field', key, `"${key}" must be a number.`);
  }

  oneOf(key: string, allowed: readonly unknown[]) {
    const value = this.target[key];
    if (value !== undefined && !allowed.includes(value)) {
      this.report('invalid-field', key, `"${key}" must be one of ${allowed.map((a) => JSON.stringify(a)).join(', ')}.`);
    }
  }

  href(key: string, required = true) {
    const value = this.target[key];
    if (value === undefined || value === '') {
      if (required) this.report('missing-field', key, `"${key}" is required.`);
      return;
    }
    if (!isSafeHref(value)) this.report('unsafe-href', key, `Unsafe or invalid link target ${JSON.stringify(value)}. Only relative, http(s), mailto: and tel: links are allowed.`);
  }

  child(key: string, required: boolean, check: (c: Checker) => void) {
    const value = this.target[key];
    if (value === undefined || value === null) {
      if (required) this.report('missing-field', key, `"${key}" is required.`);
      return;
    }
    if (!isObj(value)) {
      this.report('invalid-field', key, `"${key}" must be an object.`);
      return;
    }
    check(new Checker(value, this.at(key), this.issues, this.meta));
  }

  link(key: string, required = false) {
    this.child(key, required, (c) => {
      c.str('label');
      c.href('href');
    });
  }

  image(key: string, required = false, altRequired = true) {
    this.child(key, required, (c) => {
      const value = c.target;
      if (!isNonEmptyString(value.src)) c.report('missing-field', 'src', '"src" is required.');
      else if (!isSafeImageSrc(value.src)) c.report('unsafe-src', 'src', `Unsafe image source ${JSON.stringify(value.src)}.`);
      if (altRequired && typeof value.alt !== 'string') c.report('missing-alt', 'alt', 'Image alt text is required (use "" only for decorative images).');
    });
  }

  richText(key: string, required = true) {
    this.child(key, required, (c) => {
      c.oneOf('format', ['html']);
      if (typeof c.target.html !== 'string') c.report('missing-field', 'html', '"html" is required.');
      else {
        const { removed } = neutraliseUnsafeUrls(c.target.html);
        if (removed.length > 0) c.report('unsafe-href', 'html', `Rich text contains ${removed.length} link or image URL(s) with an unsafe scheme; they will be removed.`);
      }
    });
  }

  each(key: string, min: number, max: number, check: (c: Checker, index: number) => void) {
    const value = this.target[key];
    if (value === undefined || value === null) {
      if (min > 0) this.report('missing-field', key, `"${key}" is required (at least ${min}).`);
      return;
    }
    if (!Array.isArray(value)) {
      this.report('invalid-field', key, `"${key}" must be a list.`);
      return;
    }
    if (value.length < min) this.report('too-few', key, `"${key}" needs at least ${min} item(s); it has ${value.length}.`);
    if (value.length > max) this.report('too-many', key, `"${key}" has ${value.length} items; more than ${max} may not display well.`, 'warning');
    value.forEach((item, index) => {
      if (!isObj(item)) this.report('invalid-field', `${key}[${index}]`, `"${key}[${index}]" must be an object.`);
      else check(new Checker(item, `${this.at(key)}[${index}]`, this.issues, this.meta), index);
    });
  }

  /** ISO 8601 date ("2026-03-14") or date-time ("2026-03-14T09:30:00Z") that is a real calendar date. */
  date(key: string, required = true) {
    const value = this.target[key];
    if (value === undefined || value === null || value === '') {
      if (required) this.report('missing-field', key, `"${key}" is required (an ISO 8601 date such as "2026-03-14").`);
      return;
    }
    if (!isIsoDate(value)) this.report('invalid-date', key, `"${key}" must be an ISO 8601 date such as "2026-03-14"; got ${JSON.stringify(value)}.`);
  }

  /** A list of strings. */
  strings(key: string, required = false) {
    const value = this.target[key];
    if (value === undefined || value === null) {
      if (required) this.report('missing-field', key, `"${key}" is required.`);
      return;
    }
    if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) this.report('invalid-field', key, `"${key}" must be a list of text values.`);
  }

  get value() {
    return this.target;
  }
}

/** True for "YYYY-MM-DD" (optionally with a time and zone) naming a real calendar date. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.exec(value);
  if (!match) return false;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day && !Number.isNaN(Date.parse(value));
}
