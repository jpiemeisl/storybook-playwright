import type { AuthorContent } from '../../component-types/content';
import { formatIsoDate } from '../../utils/formatDate';
import { Image } from '../Image';
import { Link } from '../Link';
import styles from './AuthorByline.module.css';

/** Props for AuthorByline. */
export interface AuthorBylineProps {
  /** The author. Without an avatar, their initials are shown instead; with `href`, the name is a link. */
  author: AuthorContent;
  /** ISO 8601 date, e.g. "2026-03-14". */
  date?: string;
  /** Already formatted, e.g. "6 min read". */
  readingTime?: string;
  /** `block` adds the author's role and bio. */
  variant?: 'inline' | 'block';
}

/** Initials for the avatar fallback, e.g. "Ana Ruiz" → "AR". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Author, date and reading time for an article. Missing pieces are simply left out. */
export function AuthorByline({ author, date, readingTime, variant = 'inline' }: AuthorBylineProps) {
  const name = author.href ? (
    <Link href={author.href} className={styles.nameLink}>
      {author.name}
    </Link>
  ) : (
    author.name
  );

  return (
    <div className={[styles.byline, styles[variant]].join(' ')}>
      {author.avatar ? (
        <Image {...author.avatar} alt="" className={styles.avatar} />
      ) : (
        <span className={[styles.avatar, styles.initials].join(' ')} aria-hidden="true">
          {initials(author.name)}
        </span>
      )}
      <div className={styles.text}>
        <p className={styles.line}>
          <span className={styles.name}>{name}</span>
          {variant === 'block' && author.role && <span className={styles.role}>{author.role}</span>}
        </p>
        {(date || readingTime) && (
          <p className={[styles.line, styles.meta].join(' ')}>
            {date && <time dateTime={date}>{formatIsoDate(date)}</time>}
            {date && readingTime && <span aria-hidden="true"> · </span>}
            {readingTime && <span>{readingTime}</span>}
          </p>
        )}
        {variant === 'block' && author.bio && <div className={styles.bio}>{author.bio}</div>}
      </div>
    </div>
  );
}
