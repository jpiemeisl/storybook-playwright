import type { ReactNode } from 'react';
import styles from './SidebarLayout.module.css';

export interface SidebarLayoutProps {
  /** Main column, e.g. an article body. */
  children: ReactNode;
  /** Side column, e.g. a TableOfContents. Comes first in the DOM, so on narrow screens it sits above the main column. */
  aside?: ReactNode;
  /** Side of the aside from 64rem. Default "end". */
  asidePosition?: 'start' | 'end';
}

/**
 * Two columns from 64rem (main plus a 16rem aside), one column below with the aside first. The aside
 * cell spans the full row height, so a `position: sticky` child (like TableOfContents) stays in view.
 * The 64rem breakpoint matches TableOfContents, which switches from collapsible to sticky there.
 * Without an aside, the main column simply takes the full width.
 */
export function SidebarLayout({ children, aside, asidePosition = 'end' }: SidebarLayoutProps) {
  if (!aside) return <div className={styles.main}>{children}</div>;
  return (
    <div className={[styles.layout, styles[asidePosition]].join(' ')}>
      <div className={styles.aside}>{aside}</div>
      <div className={styles.main}>{children}</div>
    </div>
  );
}
