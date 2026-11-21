import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Icon } from '../Icon';
import styles from './Modal.module.css';

export type ModalSize = 'sm' | 'md' | 'lg' | 'full';

export interface ModalProps {
  open: boolean;
  /** Called on Escape, backdrop click and the close button. */
  onClose: () => void;
  title: ReactNode;
  /** Hide the title visually (it still names the dialog), e.g. for a lightbox. */
  hideTitle?: boolean;
  description?: ReactNode;
  size?: ModalSize;
  children?: ReactNode;
  /** Actions row at the bottom, e.g. Cancel / Confirm buttons. */
  footer?: ReactNode;
  className?: string;
}

/**
 * Dialog built on <dialog>.showModal(): focus moves in on open (to the close button) and back to the
 * opener on close, the page behind is inert, Escape and backdrop clicks close it, and page scroll is
 * locked while open. Controlled via `open`.
 */
export function Modal({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  size = 'md',
  children,
  footer,
  className,
}: ModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);

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
    <dialog
      ref={dialogRef}
      className={[styles.dialog, styles[size], className].filter(Boolean).join(' ')}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      // React state stays in charge of closing, for native cancel and synthetic Escape alike.
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <h2 id={titleId} className={hideTitle ? styles.visuallyHidden : styles.title}>
              {title}
            </h2>
            <button type="button" className={styles.close} onClick={onClose} aria-label="Close">
              <Icon name="close" />
            </button>
          </div>
          {description && (
            <p id={descriptionId} className={styles.description}>
              {description}
            </p>
          )}
          {children && <div className={styles.body}>{children}</div>}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      )}
    </dialog>
  );
}
