import type { HTMLAttributes } from 'react';
import styles from './Badge.module.css';

/** Color role of a Badge. */
export type BadgeTone = 'neutral' | 'accent' | 'success' | 'danger';
/** Padding and font size of a Badge. */
export type BadgeSize = 'sm' | 'md';

/** Props for Badge. Accepts native `<span>` attributes. */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /** Color role. */
  tone?: BadgeTone;
  /** Padding and font size. */
  size?: BadgeSize;
}

/** A small inline `<span>` label for a status, count or category. Not interactive; use TagList for linked tags. */
export function Badge({ tone = 'neutral', size = 'md', className, ...rest }: BadgeProps) {
  const classes = [styles.badge, styles[tone], styles[size], className].filter(Boolean).join(' ');
  return <span className={classes} {...rest} />;
}
