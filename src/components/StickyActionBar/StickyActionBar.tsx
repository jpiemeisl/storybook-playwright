import type { ActionLink } from '../../component-types/sections';
import { ButtonLink } from '../Button';
import styles from './StickyActionBar.module.css';

export interface StickyActionBarProps {
  action: ActionLink;
  /** Optional short line beside the button. */
  message?: string;
}

/**
 * A call to action pinned to the bottom of the viewport below 48rem, with pure CSS `position: sticky`.
 * Place it as the last child of <main>. While it is shown, the document gets a matching
 * scroll-padding-bottom so focused or anchored content is never hidden behind it. Hidden from 48rem.
 */
export function StickyActionBar({ action, message }: StickyActionBarProps) {
  return (
    <div className={styles.bar} data-sticky-action-bar="">
      {message && <p className={styles.message}>{message}</p>}
      <ButtonLink href={action.href} size="lg" className={styles.button}>
        {action.label}
      </ButtonLink>
    </div>
  );
}
