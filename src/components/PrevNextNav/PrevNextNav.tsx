import { Icon } from '../Icon';
import { Link } from '../Link';
import styles from './PrevNextNav.module.css';

export interface PrevNextLink {
  /** Title of the linked item, e.g. the previous case study. */
  title: string;
  href: string;
}

export interface PrevNextNavProps {
  previous?: PrevNextLink;
  next?: PrevNextLink;
  /** Small label above each title; part of the link's accessible name. Default "Previous" / "Next". */
  previousLabel?: string;
  nextLabel?: string;
  /** Accessible name of the nav landmark. */
  'aria-label'?: string;
}

/** A previous/next pair of links between items in a series (case studies, articles). */
export function PrevNextNav({ previous, next, previousLabel = 'Previous', nextLabel = 'Next', 'aria-label': label = 'More' }: PrevNextNavProps) {
  if (!previous && !next) return null;
  return (
    <nav aria-label={label} className={styles.nav}>
      {previous && (
        <Link href={previous.href} unstyled className={styles.link}>
          <span className={styles.label}>
            <Icon name="arrow-left" size="sm" />
            {previousLabel}
          </span>
          <span className={styles.title}>{previous.title}</span>
        </Link>
      )}
      {next && (
        <Link href={next.href} unstyled className={[styles.link, styles.next].join(' ')}>
          <span className={styles.label}>
            {nextLabel}
            <Icon name="arrow-right" size="sm" />
          </span>
          <span className={styles.title}>{next.title}</span>
        </Link>
      )}
    </nav>
  );
}
