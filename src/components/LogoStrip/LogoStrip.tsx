import type { LogoItem } from '../../component-types/sections';
import { Image } from '../Image';
import { Link } from '../Link';
import { Text } from '../Text';
import styles from './LogoStrip.module.css';

export interface LogoStripProps {
  items: LogoItem[];
  /** Short label above the logos, e.g. "Trusted by". */
  heading?: string;
  /** Muted grayscale logos that return to full colour on hover and focus. Default true. */
  grayscale?: boolean;
}

/** Row of customer or partner logos that wraps to as many lines as needed. No motion. */
export function LogoStrip({ items, heading, grayscale = true }: LogoStripProps) {
  return (
    <div className={[styles.root, grayscale && styles.grayscale].filter(Boolean).join(' ')}>
      {heading && (
        <Text as="p" size="sm" weight="strong" tone="muted" className={styles.heading}>
          {heading}
        </Text>
      )}
      <ul className={styles.list}>
        {items.map((item) => {
          const logo = <Image {...item.image} alt={item.name} className={styles.logo} />;
          return (
            <li key={item.name} className={styles.item}>
              {item.href ? (
                <Link href={item.href} unstyled className={styles.link}>
                  {logo}
                </Link>
              ) : (
                logo
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
