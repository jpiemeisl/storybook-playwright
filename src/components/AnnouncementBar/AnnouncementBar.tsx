import { useState } from 'react';
import type { ActionLink } from '../../component-types/sections';
import { Container } from '../Container';
import { Icon } from '../Icon';
import { Link } from '../Link';
import styles from './AnnouncementBar.module.css';

export type AnnouncementTone = 'accent' | 'inverse' | 'subtle';

export interface AnnouncementBarProps {
  /** Plain text, ideally under 120 characters. */
  message: string;
  /** Optional link after the message. */
  link?: ActionLink;
  tone?: AnnouncementTone;
  /** Show a dismiss button. Uncontrolled unless `dismissed` is passed. */
  dismissible?: boolean;
  /** Controlled dismissed state (persist it yourself if you want it to stick). */
  dismissed?: boolean;
  /** Called when the dismiss button is pressed (controlled or uncontrolled). */
  onDismiss?: () => void;
  /** Accessible name of the region. Default "Announcement". */
  label?: string;
}

/**
 * Site-wide message above the header, as a labelled region. Dismissal is controlled (`dismissed` +
 * `onDismiss`) or kept in memory only: nothing is written to storage or cookies.
 */
export function AnnouncementBar({
  message,
  link,
  tone = 'accent',
  dismissible = false,
  dismissed,
  onDismiss,
  label = 'Announcement',
}: AnnouncementBarProps) {
  const [internalDismissed, setInternalDismissed] = useState(false);
  const isDismissed = dismissed ?? internalDismissed;
  if (isDismissed) return null;

  const dismiss = () => {
    if (dismissed === undefined) setInternalDismissed(true);
    onDismiss?.();
  };

  return (
    <section aria-label={label} className={[styles.bar, styles[tone]].join(' ')} data-surface={tone === 'inverse' ? 'inverse' : undefined}>
      <Container size="xl" className={styles.inner}>
        <p className={styles.message}>
          {message}
          {link && (
            <>
              {' '}
              <Link href={link.href} className={styles.link}>
                {link.label}
              </Link>
            </>
          )}
        </p>
        {dismissible && (
          <button type="button" className={styles.dismiss} aria-label="Dismiss announcement" onClick={dismiss}>
            <Icon name="close" size="sm" />
          </button>
        )}
      </Container>
    </section>
  );
}
