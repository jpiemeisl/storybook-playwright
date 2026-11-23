import { useEffect, useRef, useState } from 'react';
import type { ShareNetwork } from '../../component-types/content';
import { Icon, type IconName } from '../Icon';
import { Link } from '../Link';
import styles from './ShareLinks.module.css';

/** Props for ShareLinks. */
export interface ShareLinksProps {
  /** The URL to share. Required: never read from window at render time. */
  url: string;
  /** Page title, used as the post text on X and the email subject. */
  title?: string;
  /** Networks to offer, in order. Default all four: x, linkedin, facebook, email. */
  networks?: ShareNetwork[];
  /** Accessible name of the group. */
  label?: string;
}

const networks: Record<ShareNetwork, { name: string; icon: IconName; href: (url: string, title: string) => string }> = {
  x: {
    name: 'X',
    icon: 'x',
    href: (url, title) => `https://x.com/intent/post?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'linkedin',
    href: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    href: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  email: {
    name: 'email',
    icon: 'mail',
    href: (url, title) => `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`,
  },
};

/** Fallback for browsers or contexts without the async Clipboard API. */
function legacyCopy(text: string): boolean {
  const field = document.createElement('textarea');
  field.value = text;
  field.setAttribute('readonly', '');
  field.style.position = 'fixed';
  field.style.opacity = '0';
  document.body.append(field);
  field.select();
  let ok = false;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  field.remove();
  return ok;
}

const RESET_MS = 2500;

/**
 * Plain share links (no third-party scripts or SDKs) plus "Copy link". Network links open in a new
 * tab; the copy result is announced through a polite live region.
 */
export function ShareLinks({ url, title = '', networks: chosen = ['x', 'linkedin', 'facebook', 'email'], label = 'Share' }: ShareLinksProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'failed'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = async () => {
    let ok = false;
    try {
      if (!navigator.clipboard) throw new Error('No clipboard API');
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      ok = legacyCopy(url);
    }
    setStatus(ok ? 'copied' : 'failed');
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), RESET_MS);
  };

  return (
    <div role="group" aria-label={label} className={styles.share}>
      <ul className={styles.list}>
        {chosen.map((network) => {
          const { name, icon, href } = networks[network];
          const isEmail = network === 'email';
          return (
            <li key={network}>
              <Link
                href={href(url, title)}
                unstyled
                external={!isEmail}
                externalIcon={false}
                target={isEmail ? undefined : '_blank'}
                aria-label={isEmail ? 'Share by email' : `Share on ${name} (opens in a new tab)`}
                className={styles.button}
              >
                <Icon name={icon} />
              </Link>
            </li>
          );
        })}
        <li>
          <button type="button" className={[styles.button, styles.copy].join(' ')} onClick={copy} data-status={status}>
            <Icon name={status === 'copied' ? 'check' : 'link'} />
            <span>{status === 'copied' ? 'Copied' : 'Copy link'}</span>
          </button>
        </li>
      </ul>
      <span className={styles.visuallyHidden} aria-live="polite">
        {status === 'copied' ? 'Link copied' : status === 'failed' ? `Couldn’t copy. The link is ${url}` : ''}
      </span>
    </div>
  );
}
