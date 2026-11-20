import { useEffect, useId, useRef, useState } from 'react';
import type { NavItem } from '../../content-types/navigation';
import { Icon } from '../Icon';
import { Link } from '../Link';
import styles from './MobileMenu.module.css';

export interface MenuCta {
  label: string;
  href: string;
}

export interface MobileMenuProps {
  /** id of the dialog, for the opening button's aria-controls. */
  id?: string;
  open: boolean;
  /** Called on Escape, scrim click, the close button and after following a link. */
  onClose: () => void;
  items: NavItem[];
  cta?: MenuCta;
  /** Accessible name of the nav landmark inside the menu. */
  'aria-label'?: string;
  /** Accessible name of the dialog. */
  title?: string;
}

/**
 * Side drawer built on <dialog>.showModal(), which provides focus trapping, inertness of the page
 * behind it and a ::backdrop scrim. Locks page scroll while open and returns focus to whatever
 * opened it.
 */
export function MobileMenu({
  id,
  open,
  onClose,
  items,
  cta,
  'aria-label': navLabel = 'Main',
  title = 'Menu',
}: MobileMenuProps) {
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
      id={id}
      className={styles.dialog}
      aria-label={title}
      // Keep React state in charge of closing, whether Escape arrives as a native cancel or a keydown.
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
      // A click on the dialog element itself (not its content) is a click on the scrim.
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={styles.panel}>
        <div className={styles.top}>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Close menu">
            <Icon name="close" />
          </button>
        </div>

        <nav aria-label={navLabel} className={styles.nav}>
          <ul className={styles.list}>
            {items.map((item) => (
              <MenuEntry key={item.href} item={item} onNavigate={onClose} />
            ))}
          </ul>
        </nav>

        {cta && (
          <div className={styles.footer}>
            <Link href={cta.href} variant="standalone" className={styles.cta} onClick={onClose}>
              {cta.label}
            </Link>
          </div>
        )}
      </div>
    </dialog>
  );
}

function MenuEntry({ item, onNavigate }: { item: NavItem; onNavigate: () => void }) {
  const panelId = useId();
  const children = item.children ?? [];
  // Sections containing the current page start expanded.
  const [expanded, setExpanded] = useState(() => !!item.current || children.some((child) => child.current));

  if (!children.length) {
    return (
      <li>
        <Link
          href={item.href}
          className={styles.link}
          aria-current={item.current ? 'page' : undefined}
          onClick={onNavigate}
        >
          {item.label}
        </Link>
      </li>
    );
  }

  const entries: NavItem[] = [{ label: `${item.label} overview`, href: item.href, current: item.current }, ...children];

  return (
    <li>
      <button
        type="button"
        className={[styles.link, styles.toggle].join(' ')}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((value) => !value)}
      >
        {item.label}
        <Icon name="chevron-down" className={styles.chevron} />
      </button>
      <ul id={panelId} className={styles.sublist} hidden={!expanded}>
        {entries.map((child) => (
          <li key={child.href + child.label}>
            <Link
              href={child.href}
              className={styles.sublink}
              aria-current={child.current ? 'page' : undefined}
              onClick={onNavigate}
            >
              {child.label}
            </Link>
          </li>
        ))}
      </ul>
    </li>
  );
}
