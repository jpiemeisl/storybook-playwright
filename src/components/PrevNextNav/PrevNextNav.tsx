import { Icon } from '../Icon';
import { Link } from '../Link';
import styles from './PrevNextNav.module.css';

/** One side of a PrevNextNav: the title and URL of the neighboring item. */
export interface PrevNextLink {
  /** Title of the linked item, e.g. the previous case study. */
  title: string;
  href: string;
}

/** Props for PrevNextNav. Renders nothing when neither `previous` nor `next` is given. */
export interface PrevNextNavProps {
  /** The previous item in the series. Omit on the first item. */
  previous?: PrevNextLink;
  /** The next item in the series. Omit on the last item. */
  next?: PrevNextLink;
  /** Small label above each title; part of the link's accessible name. Default "Previous" / "Next". */
  previousLabel?: string;
  /** Small label above the next title. Default "Next". */
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
