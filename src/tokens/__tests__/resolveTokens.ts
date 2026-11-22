/*
 * Test helper: resolves semantic tokens for a theme and surface from the CSS files themselves, and
 * computes WCAG contrast. Reads primitives.css, semantic.css and themes/*.css; resolves var() chains;
 * parses #hex and rgb(); composites translucent colours over their background.
 */
import { readFileSync } from 'node:fs';
import { parseRules } from '../../../scripts/check-theme-contract.mjs';

const dir = new URL('../', import.meta.url);
const read = (path: string) => readFileSync(new URL(path, dir), 'utf8');
const decls = (rule: { decls: Map<string, string> } | undefined) => Object.fromEntries([...(rule?.decls ?? [])].filter(([k]) => k.startsWith('--')));

export type Surface = 'page' | 'inverse';

/** Token name → raw value for a theme and surface, before var() resolution. */
export function tokenMap(theme: string, surface: Surface): Record<string, string> {
  const primitives = decls(parseRules(read('primitives.css'))[0]);
  const semantic = parseRules(read('semantic.css'));
  const palette = decls(semantic.find((r) => r.selector.includes(':root')));
  const inverse = decls(semantic.find((r) => r.selector === "[data-surface='inverse']"));
  const themeRules = theme === 'default' ? [] : parseRules(read(`themes/${theme}.css`));
  const themePalette = decls(themeRules.find((r) => r.selector.includes(':scope')));
  const themeInverse = decls(themeRules.find((r) => r.selector === "[data-surface='inverse']"));
  const base = { ...primitives, ...palette, ...themePalette };
  return surface === 'page' ? base : { ...base, ...inverse, ...themeInverse };
}

/** Resolves var() chains; throws on unresolved references or cycles. */
export function resolve(map: Record<string, string>, token: string, seen: string[] = []): string {
  if (seen.includes(token)) throw new Error(`cycle: ${[...seen, token].join(' → ')}`);
  const raw = map[token];
  if (raw === undefined) throw new Error(`unresolved ${token}${seen.length ? ` (via ${seen.join(' → ')})` : ''}`);
  return raw.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^)]*))?\)/g, (_, name: string, fallback?: string) => (map[name] === undefined && fallback !== undefined ? fallback : resolve(map, name, [...seen, token])));
}

export interface Rgba {
  r: number;
  g: number;
  b: number;
  a: number;
}

/** #rgb, #rrggbb, #rrggbbaa, rgb(r g b / a), rgb(r, g, b, a). */
export function parseColour(value: string): Rgba {
  const v = value.trim();
  const hex = /^#([0-9a-f]{3,8})$/i.exec(v);
  if (hex) {
    const h = hex[1]!.length <= 4 ? [...hex[1]!].map((c) => c + c).join('') : hex[1]!;
    return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1 };
  }
  const rgb = /^rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[/,]\s*([\d.]+%?))?\s*\)$/.exec(v);
  if (rgb) {
    const alpha = rgb[4] === undefined ? 1 : rgb[4].endsWith('%') ? Number(rgb[4].slice(0, -1)) / 100 : Number(rgb[4]);
    return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]), a: alpha };
  }
  throw new Error(`not a colour: ${value}`);
}

/** Source over destination (destination must be opaque). */
export const composite = (top: Rgba, under: Rgba): Rgba => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });

const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = ({ r, g, b }: Rgba) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);

/** WCAG 2 contrast ratio of two opaque colours. */
export function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** Resolved, opaque colour of a token, compositing translucent values over `over`. */
export function colourOf(map: Record<string, string>, token: string, over?: Rgba): Rgba {
  const c = parseColour(resolve(map, token));
  if (c.a >= 1) return c;
  if (!over) throw new Error(`${token} is translucent; give a background to composite over`);
  return composite(c, over);
}
