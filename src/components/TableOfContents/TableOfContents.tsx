import { useEffect, useId, useState } from 'react';
import type { TocItem } from '../../component-types/content';
import { Link } from '../Link';
import styles from './TableOfContents.module.css';

/** Props for TableOfContents. Renders nothing when `items` is empty. */
export interface TableOfContentsProps {
  /** Headings to list, in page order. Level-3 items nest under the preceding level-2 item. See buildTocFromHeadings. */
  items: TocItem[];
  /** Controlled active heading id. */
  activeId?: string;
  /** Track the heading in view with IntersectionObserver (ignored when `activeId` is set). */
  observe?: boolean;
  /** Visible title and the nav's accessible name. Default "On this page". */
  title?: string;
}

interface TocGroup {
  item: TocItem;
  children: TocItem[];
}

/** Pure: turns page headings into TOC items (levels 2 and 3 only). No DOM access. */
export function buildTocFromHeadings(headings: { id: string; text: string; level: number }[]): TocItem[] {
  return headings
    .filter((heading) => heading.id && (heading.level === 2 || heading.level === 3))
    .map((heading) => ({ id: heading.id, label: heading.text, level: heading.level as 2 | 3 }));
}

/** Nests each level-3 item under the preceding level-2 item. */
function group(items: TocItem[]): TocGroup[] {
  const groups: TocGroup[] = [];
  for (const item of items) {
    const parent = groups[groups.length - 1];
    if (item.level === 3 && parent) parent.children.push(item);
    else groups.push({ item, children: [] });
  }
  return groups;
}

function useActiveHeading(ids: string[], enabled: boolean) {
  const [active, setActive] = useState<string | undefined>();
  useEffect(() => {
    if (!enabled || typeof IntersectionObserver === 'undefined') return;
    const elements = ids.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    if (elements.length === 0) return;
    const visible = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.add(entry.target.id);
          else visible.delete(entry.target.id);
        }
        // The first heading (in document order) inside the reading band wins.
        const first = ids.find((id) => visible.has(id));
        if (first) setActive(first);
      },
      // Reading band: below a sticky header, top 40% of the viewport.
      { rootMargin: '-80px 0px -60% 0px' },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [ids.join('|'), enabled]);
  return active;
}

/**
 * "On this page" navigation. Wide screens (64rem+): a sticky list. Narrow screens: a collapsible
 * <details>. The active link gets aria-current="location".
 */
export function TableOfContents({ items, activeId, observe = false, title = 'On this page' }: TableOfContentsProps) {
  const titleId = useId();
  const observed = useActiveHeading(
    items.map((item) => item.id),
    observe && activeId === undefined,
  );
  const current = activeId ?? observed;

  if (items.length === 0) return null;

  const renderLink = (item: TocItem) => (
    <Link
      href={`#${item.id}`}
      unstyled
      className={styles.link}
      aria-current={item.id === current ? 'location' : undefined}
    >
      {item.label}
    </Link>
  );

  const list = (
    <ol className={styles.list}>
      {group(items).map(({ item, children }) => (
        <li key={item.id}>
          {renderLink(item)}
          {children.length > 0 && (
            <ol className={styles.sublist}>
              {children.map((child) => (
                <li key={child.id}>{renderLink(child)}</li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  );

  return (
    <nav aria-labelledby={titleId} className={styles.toc}>
      {/* Wide: always-open list. */}
      <div className={styles.wide}>
        <p id={titleId} className={styles.title}>
          {title}
        </p>
        {list}
      </div>
      {/* Narrow: collapsed by default. Only one of the two is ever displayed. */}
      <details className={styles.narrow}>
        <summary className={styles.summary}>{title}</summary>
        {list}
      </details>
    </nav>
  );
}
