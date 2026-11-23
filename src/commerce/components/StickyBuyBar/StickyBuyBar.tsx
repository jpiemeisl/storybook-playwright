import type { ReactNode } from 'react';
import styles from './StickyBuyBar.module.css';

/** Props for StickyBuyBar, the bottom purchase bar shown on narrow viewports while the real action is out of view. */
export interface StickyBuyBarProps {
  /** Render the bar. Pass useOutOfView(ref) of the real action: the bar exists only while it is out of view. */
  shown: boolean;
  /** Short context, e.g. the product title and price, or "Due today $94.77". One line; truncated. */
  summary: ReactNode;
  /** The action: the same component as the real one (AddToCart with `secondary`, or a submit Button with `form`). */
  children: ReactNode;
}

/**
 * A purchase bar pinned to the bottom of narrow viewports (below 48rem) while the page's real action is
 * scrolled out of view. It is not rendered otherwise, never in print, and never from 48rem. While it shows,
 * the page reserves room for it: scroll-padding-bottom (focused or scrolled-to content stops above it) and
 * matching padding at the end of the page (the last controls can scroll clear of it). It respects the
 * bottom safe-area inset, and toasts and the cookie banner stack above it.
 */
export function StickyBuyBar({ shown, summary, children }: StickyBuyBarProps) {
  if (!shown) return null;
  return (
    <div className={styles.bar} data-sticky-action-bar="" data-sticky-buy-bar="">
      <div className={styles.summary}>{summary}</div>
      <div className={styles.action}>{children}</div>
    </div>
  );
}
