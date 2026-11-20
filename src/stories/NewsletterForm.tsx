import { useId } from 'react';
import { Button } from '../components/Button';
import { Text } from '../components/Text';
import styles from './NewsletterForm.module.css';

/* Story-only newsletter form for the Footer slot. A real form component arrives in a later phase. */
export function NewsletterForm() {
  const inputId = useId();
  return (
    <form className={styles.form} onSubmit={(event) => event.preventDefault()}>
      <label htmlFor={inputId} className={styles.label}>
        Get one practical accessibility tip a month
      </label>
      <div className={styles.row}>
        <input id={inputId} type="email" name="email" autoComplete="email" placeholder="you@example.com" className={styles.input} />
        <Button type="submit">Subscribe</Button>
      </div>
      <Text size="xs" tone="muted">
        No spam. Unsubscribe at any time.
      </Text>
    </form>
  );
}
