import { useId, useState } from 'react';
import { Icon } from '../../../components/Icon';
import styles from './LicenseKey.module.css';

export interface LicenseKeyProps {
  /** The key. Shown only after the customer reveals it; never put in an attribute, URL or log. */
  value: string;
  /** Default "Licence key". */
  label?: string;
}

/** "••••-••••-••••-9VNA": everything except the last four characters masked, separators kept. */
export const maskKey = (value: string) => {
  const keep = value.replace(/[^A-Za-z0-9]/g, '').slice(-4).length;
  let seen = 0;
  const total = value.replace(/[^A-Za-z0-9]/g, '').length;
  return [...value].map((ch) => (/[A-Za-z0-9]/.test(ch) ? (++seen > total - keep ? ch : '•') : ch)).join('');
};

/**
 * A licence key in monospace, masked by default (only the last four characters show, and the real key
 * is not in the DOM until revealed). "Show key" is a toggle button (aria-pressed); "Copy" copies the
 * key from the event handler and announces "Copied" (or how to copy manually) politely.
 */
export function LicenseKey({ value, label = 'Licence key' }: LicenseKeyProps) {
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState('');
  const id = useId();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied`);
    } catch {
      setRevealed(true);
      setMessage(`Couldn’t copy automatically. The key is now shown: select it and copy it.`);
    }
  };

  return (
    <div className={styles.root}>
      <span className={styles.label} id={`${id}-label`}>
        {label}
      </span>
      <div className={styles.row}>
        <code className={styles.value} aria-labelledby={`${id}-label`}>
          {revealed ? value : maskKey(value)}
          {!revealed && <span className={styles.visuallyHidden}> (hidden, ends in {value.replace(/[^A-Za-z0-9]/g, '').slice(-4)})</span>}
        </code>
        <button type="button" className={styles.button} aria-pressed={revealed} onClick={() => setRevealed((r) => !r)}>
          <Icon name={revealed ? 'eye-off' : 'eye'} size="sm" />
          Show key
        </button>
        <button type="button" className={styles.button} onClick={copy}>
          <Icon name="copy" size="sm" />
          Copy
        </button>
      </div>
      <p role="status" className={styles.message}>
        {message}
      </p>
    </div>
  );
}
