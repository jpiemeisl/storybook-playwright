/*
 * Compile-time guard that content types stay JSON-serializable: no functions, symbols, bigint,
 * Date or other class instances, and no React nodes.
 */
import type { SiteChrome } from './chrome';
import type { Block, PageContent } from './blocks';

type JsonPrimitive = string | number | boolean | null;

/** Depth counter so recursive types (e.g. NavItem.children) terminate. */
type Prev = [never, 0, 1, 2, 3, 4, 5, 6, 7, 8];

/** Distributes over unions: yields true for JSON-safe members and false for the rest. */
type Check<T, Depth extends number = 8> = [Depth] extends [never]
  ? true
  : T extends JsonPrimitive | undefined
    ? true
    : T extends readonly (infer U)[]
      ? Check<U, Prev[Depth]>
      : T extends Date | ((...args: never[]) => unknown) | bigint | symbol
        ? false
        : T extends object
          ? { [K in keyof T]-?: Check<T[K], Prev[Depth]> }[keyof T]
          : false;

/** true when every value reachable from T is JSON (undefined allowed: JSON.stringify drops it). */
export type IsJson<T> = [Check<T>] extends [true] ? true : false;

type Assert<T extends true> = T;

// If any of these stops compiling, a non-serializable field slipped into the content model.
export type _PageContentIsJson = Assert<IsJson<PageContent>>;
export type _BlockIsJson = Assert<IsJson<Block>>;
export type _SiteChromeIsJson = Assert<IsJson<SiteChrome>>;
