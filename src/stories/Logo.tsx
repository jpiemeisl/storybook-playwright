import { Link } from '../components/Link';
import styles from './Logo.module.css';

/* Story-only wordmark for a fictional studio. Not exported from the library. */
export function Logo() {
  return (
    <Link href="/" className={styles.logo}>
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" className={styles.mark}>
        <rect x="2" y="2" width="20" height="20" rx="5" fill="currentColor" />
        <path d="M8 16V8h4.5a2.5 2.5 0 0 1 0 5H8" fill="none" stroke="var(--color-bg)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      Pattern Studio
    </Link>
  );
}
