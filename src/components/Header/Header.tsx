import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import type { NavItem } from '../../content-types/navigation';
import { Container } from '../Container';
import { Icon } from '../Icon';
import { Link } from '../Link';
import { MobileMenu, type MenuCta } from '../MobileMenu';
import { NavDropdown } from './NavDropdown';
import styles from './Header.module.css';

export interface HeaderProps {
  /** Logo slot, usually a Link to the home page. */
  logo: ReactNode;
  /** Main navigation. Empty: a logo-only header (no nav landmark, no menu button), e.g. for landing pages. */
  items: NavItem[];
  cta?: MenuCta;
  /** Stick to the top of the viewport while scrolling. */
  sticky?: boolean;
  /** Accessible name of the nav landmark. */
  'aria-label'?: string;
  /** Visible label of the menu button. */
  menuLabel?: string;
}

/**
 * Site header. From 48rem the nav is inline, with dropdowns for items with children. Below 48rem,
 * or whenever the inline nav does not fit its slot (measured), a menu button opens MobileMenu instead.
 */
export function Header({
  logo,
  items,
  cta,
  sticky = false,
  'aria-label': navLabel = 'Main',
  menuLabel = 'Menu',
}: HeaderProps) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const slotRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Collapse to the menu button whenever the inline nav is wider than the space it has.
  useEffect(() => {
    const slot = slotRef.current;
    const list = listRef.current;
    if (!slot || !list) return;
    const measure = () => setOverflowing(list.offsetWidth > slot.clientWidth);
    const observer = new ResizeObserver(measure);
    observer.observe(slot);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const hasNav = items.length > 0;
  const classes = [styles.header, sticky && styles.sticky].filter(Boolean).join(' ');

  return (
    <header className={classes} data-overflowing={overflowing || undefined} data-no-nav={hasNav ? undefined : ''}>
      <Container size="xl" className={styles.inner}>
        <div className={styles.logo}>{logo}</div>

        {hasNav && (
          <div ref={slotRef} className={styles.navSlot}>
            <nav aria-label={navLabel}>
              <ul ref={listRef} className={styles.list}>
                {items.map((item, index) => (
                  <li key={item.href}>
                    {item.children?.length ? (
                      <NavDropdown
                        item={item}
                        open={openDropdown === index}
                        onOpenChange={(open) =>
                          setOpenDropdown((current) => (open ? index : current === index ? null : current))
                        }
                      />
                    ) : (
                      <Link href={item.href} className={styles.navLink} aria-current={item.current ? 'page' : undefined}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        )}

        {cta && (
          <Link href={cta.href} variant="standalone" className={styles.cta}>
            {cta.label}
          </Link>
        )}

        {hasNav && (
          <button
            type="button"
            className={styles.menuButton}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            aria-controls={menuId}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="menu" />
            {menuLabel}
          </button>
        )}
      </Container>

      {hasNav && <MobileMenu id={menuId} open={menuOpen} onClose={closeMenu} items={items} cta={cta} aria-label={navLabel} />}
    </header>
  );
}
