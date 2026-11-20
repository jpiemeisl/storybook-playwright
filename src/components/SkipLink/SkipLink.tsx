import type { AnchorHTMLAttributes } from 'react';
import styles from './SkipLink.module.css';

export interface SkipLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  /** id of the element to skip to. The target should have tabIndex={-1} so it can take focus. */
  targetId?: string;
}

/** First focusable element on the page. Hidden until focused, then pinned to the top of the viewport. */
export function SkipLink({ targetId = 'main', children = 'Skip to main content', className, ...rest }: SkipLinkProps) {
  return (
    <a href={`#${targetId}`} className={[styles.skipLink, className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </a>
  );
}
