import { useEffect, useRef, type ReactNode } from 'react';
import styles from './Prose.module.css';

interface ProseBaseProps {
  /** `large` for article lead-ins or short pages. */
  size?: 'base' | 'large';
  className?: string;
}

/**
 * Pass either React children or an HTML string. The string is inserted as-is: the CALLER must
 * sanitize it (e.g. on the server with a sanitizer of their choice). This library does not.
 */
export type ProseProps = ProseBaseProps &
  ({ children: ReactNode; sanitizedHtml?: never } | { sanitizedHtml: string; children?: never });

/**
 * Typography for long-form content (CMS rich text, Markdown output). Styles elements, not classes,
 * so plain HTML works. Colours come from semantic tokens, so it reads correctly on any Section
 * background, including inverse.
 */
export function Prose({ size = 'base', className, children, sanitizedHtml }: ProseProps) {
  const ref = useKeyboardScrollable<HTMLDivElement>();
  const classes = [styles.prose, styles[size], className].filter(Boolean).join(' ');
  if (sanitizedHtml !== undefined) {
    return <div ref={ref} className={classes} dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />;
  }
  return (
    <div ref={ref} className={classes}>
      {children}
    </div>
  );
}

/**
 * Wide code blocks and tables scroll sideways (CSS). Keyboard users can only scroll them if they are
 * focusable, which CSS can't do, so this effect adds tabindex="0" to the ones that actually overflow
 * and re-checks when the column resizes.
 */
function useKeyboardScrollable<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const update = () => {
      for (const element of root.querySelectorAll<HTMLElement>('pre, table')) {
        const overflows = element.scrollWidth > element.clientWidth + 1;
        if (overflows && !element.hasAttribute('tabindex')) element.setAttribute('tabindex', '0');
        if (!overflows && element.getAttribute('tabindex') === '0') element.removeAttribute('tabindex');
      }
    };
    update();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(update);
    observer.observe(root);
    return () => observer.disconnect();
  }, []);
  return ref;
}
