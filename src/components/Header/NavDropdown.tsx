import { useEffect, useId, useRef, type FocusEvent, type KeyboardEvent } from 'react';
import type { NavItem } from '../../content-types/navigation';
import { Icon } from '../Icon';
import { Link } from '../Link';
import styles from './Header.module.css';

export interface NavDropdownProps {
  item: NavItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Disclosure-style dropdown for one level of children: a real button toggles a list of links.
 * Enter/Space toggle, ArrowDown opens and moves into the list, arrows/Home/End move between links,
 * Escape closes and returns focus to the button. Outside click or tabbing away closes it.
 */
export function NavDropdown({ item, open, onOpenChange }: NavDropdownProps) {
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLUListElement>(null);
  const focusFirstOnOpen = useRef(false);
  const children = item.children ?? [];
  const active = item.current || children.some((child) => child.current);

  const links = () => Array.from(panelRef.current?.querySelectorAll('a') ?? []);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onOpenChange(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (open && focusFirstOnOpen.current) {
      focusFirstOnOpen.current = false;
      links()[0]?.focus();
    }
  }, [open]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && open) {
      event.preventDefault();
      onOpenChange(false);
      buttonRef.current?.focus();
      return;
    }
    if (event.target === buttonRef.current) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (open) links()[0]?.focus();
        else {
          focusFirstOnOpen.current = true;
          onOpenChange(true);
        }
      }
      return;
    }
    const all = links();
    const index = all.indexOf(event.target as HTMLAnchorElement);
    if (index === -1) return;
    const targets: Record<string, number> = { ArrowDown: index + 1, ArrowUp: index - 1, Home: 0, End: all.length - 1 };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    if (next < 0) buttonRef.current?.focus();
    else all[Math.min(next, all.length - 1)]?.focus();
  };

  // Close when focus moves to something outside (Tab away). Clicks are handled by pointerdown.
  const onBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (open && event.relatedTarget && !rootRef.current?.contains(event.relatedTarget)) onOpenChange(false);
  };

  const entries: NavItem[] = [{ label: `${item.label} overview`, href: item.href, current: item.current }, ...children];

  return (
    <div ref={rootRef} className={styles.dropdown} onKeyDown={onKeyDown} onBlur={onBlur}>
      <button
        ref={buttonRef}
        type="button"
        className={[styles.navLink, styles.toggle, active && styles.active].filter(Boolean).join(' ')}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => onOpenChange(!open)}
      >
        {item.label}
        <Icon name="chevron-down" size="sm" className={styles.chevron} />
      </button>
      <ul ref={panelRef} id={panelId} className={styles.panel} hidden={!open}>
        {entries.map((link) => (
          <li key={link.href + link.label}>
            <Link
              href={link.href}
              className={styles.panelLink}
              aria-current={link.current ? 'page' : undefined}
              onClick={() => onOpenChange(false)}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
