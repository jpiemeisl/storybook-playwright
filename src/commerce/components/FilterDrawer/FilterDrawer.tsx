import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from '../../../components/Button';
import { Icon } from '../../../components/Icon';
import styles from './FilterDrawer.module.css';

/** Props for FilterDrawer, the "Filters" button and side drawer that holds the FilterPanel on small screens. */
export interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Number of active filters, shown on the button: "Filters (3)". */
  activeCount: number;
  /** Matching products, for "Show 24 results". */
  resultCount: number;
  onClear?: () => void;
  /** The FilterPanel. Rendered only while the drawer is open. */
  children: ReactNode;
}

/**
 * "Filters (3)" button plus a side drawer on the native <dialog> (showModal: focus trap and inert
 * page), the same approach as MobileMenu. Escape and the scrim close it; page scroll is locked and focus
 * returns to the button, both from effects.
 */
export function FilterDrawer({ open, onOpenChange, activeCount, resultCount, onClear, children }: FilterDrawerProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const close = () => onOpenChange(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!open || !dialog) return;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
      root.style.overflow = previousOverflow;
      opener?.focus();
    };
  }, [open]);

  return (
    <>
      <Button variant="secondary" size="sm" aria-haspopup="dialog" aria-expanded={open} onClick={() => onOpenChange(true)}>
        <Icon name="filter" size="sm" />
        {activeCount > 0 ? `Filters (${activeCount})` : 'Filters'}
      </Button>
      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby={titleId}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            close();
          }
        }}
        onClose={(event) => !event.currentTarget.open && close()}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {open && (
          <div className={styles.panel}>
            <div className={styles.top}>
              <h2 id={titleId} className={styles.title}>
                Filters
              </h2>
              <button type="button" className={styles.close} onClick={close} aria-label="Close filters">
                <Icon name="close" />
              </button>
            </div>
            <div className={styles.body}>{children}</div>
            <div className={styles.footer}>
              {onClear && (
                <Button variant="ghost" onClick={onClear} disabled={activeCount === 0}>
                  Clear all
                </Button>
              )}
              <Button onClick={close}>
                Show {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </Button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
