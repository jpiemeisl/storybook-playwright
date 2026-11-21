/*
 * Marks the navigation item for the page being viewed. Pure: no router, no window.location; the host
 * app passes the current path.
 */
import type { NavItem } from '../content-types/navigation';

/** `exact`: same path only. `prefix`: also ancestors of the path ("/blog" for "/blog/post"). */
export type PathMatch = 'exact' | 'prefix';

/** "/Blog/?page=2#top" → "/Blog". Query, fragment and trailing slashes are ignored; case is kept. */
export function normalisePath(path: string): string {
  const withoutQuery = path.split(/[?#]/, 1)[0] ?? '';
  const trimmed = withoutQuery.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

const isExternal = (href: string) => /^[a-z][a-z0-9+.-]*:/i.test(href) || href.startsWith('//');

/**
 * Whether a nav href matches the current path. External URLs never match. In prefix mode the match
 * is on whole segments ("/blog" matches "/blog/post" but not "/blogger"), and "/" matches only "/".
 */
export function matchesPath(href: string, currentPath: string, mode: PathMatch = 'exact'): boolean {
  if (!href || isExternal(href) || href.startsWith('#')) return false;
  const target = normalisePath(href);
  const current = normalisePath(currentPath);
  if (target === current) return true;
  return mode === 'prefix' && target !== '/' && current.startsWith(`${target}/`);
}

/**
 * Returns a copy of `items` where exactly one item (at any depth) has `current: true`: the exact match
 * if there is one, otherwise (prefix mode) the deepest ancestor match. Any `current` flags already in
 * the data are replaced. Without `currentPath`, items are returned unchanged.
 */
export function markCurrent(items: NavItem[], currentPath: string | undefined, mode: PathMatch = 'prefix'): NavItem[] {
  if (currentPath === undefined) return items;
  const all: NavItem[] = [];
  const walk = (list: NavItem[]) => list.forEach((item) => (all.push(item), item.children && walk(item.children)));
  walk(items);
  const exact = all.find((item) => matchesPath(item.href, currentPath, 'exact'));
  const best =
    exact ??
    (mode === 'prefix'
      ? all
          .filter((item) => matchesPath(item.href, currentPath, 'prefix'))
          .sort((a, b) => normalisePath(b.href).length - normalisePath(a.href).length)[0]
      : undefined);
  const mark = (list: NavItem[]): NavItem[] =>
    list.map(({ current: _current, children, ...item }) => ({
      ...item,
      ...(children ? { children: mark(children) } : {}),
      ...(best && item.href === best.href && item.label === best.label ? { current: true } : {}),
    }));
  return mark(items);
}
