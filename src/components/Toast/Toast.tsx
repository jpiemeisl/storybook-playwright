import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '../Button';
import { Icon, type IconName } from '../Icon';
import { Link } from '../Link';
import styles from './Toast.module.css';

/** Kind of Toast. Sets the color, the icon and the visually hidden prefix ("Information", "Success", "Warning", "Error"). */
export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

/** A toast's content. Plain data, so it can live in a reducer. */
export interface ToastData {
  /** Unique among the current toasts. */
  id: string;
  /** Default `info`. */
  tone?: ToastTone;
  /** Short headline, e.g. "Added to cart". Also names the dismiss button. */
  title: string;
  /** Supporting text. */
  message?: ReactNode;
  /** One follow-up action: a link (`href`) or a button (`onClick`). */
  action?: { label: string; href: string } | { label: string; onClick: () => void };
  /** Announced with role="alert" instead of the polite region. Use for failures that need attention now. */
  urgent?: boolean;
  /**
   * Auto-dismiss after this many milliseconds. OFF by default (WCAG 2.2.1). When set, the timer pauses on
   * hover and while focus is inside, restarts in full when that ends, and never runs while the page is hidden.
   */
  duration?: number;
}

/** Props for Toast: the toast's data plus the dismiss callback. `urgent` has no effect here; ToastRegion uses it to pick the live region. */
export interface ToastProps extends ToastData {
  /** Called with the toast's id from the dismiss button or when `duration` runs out. Remove the toast from state here. */
  onDismiss: (id: string) => void;
}

const toneIcon: Record<ToastTone, { icon: IconName; label: string }> = {
  info: { icon: 'info', label: 'Information' },
  success: { icon: 'check-circle', label: 'Success' },
  warning: { icon: 'alert-triangle', label: 'Warning' },
  danger: { icon: 'alert-circle', label: 'Error' },
};

/** Timer for the opt-in `duration`. Runs only in an effect and is always cleaned up. */
function useAutoDismiss(duration: number | undefined, paused: boolean, dismiss: () => void) {
  const dismissRef = useRef(dismiss);
  dismissRef.current = dismiss;
  useEffect(() => {
    if (!duration || paused) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      clearTimeout(timer);
      timer = undefined;
    };
    const start = () => {
      if (document.visibilityState === 'visible' && timer === undefined) timer = setTimeout(() => dismissRef.current(), duration);
    };
    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    start();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [duration, paused]);
}

/**
 * One notification: tone icon (plus hidden tone text, never colour alone), title, message, an optional
 * action and a dismiss button. It never takes focus. Place toasts in a ToastRegion, which announces them.
 */
export function Toast({ id, tone = 'info', title, message, action, duration, onDismiss }: ToastProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const dismiss = () => onDismiss(id);
  useAutoDismiss(duration, hovered || focused, dismiss);
  const { icon, label } = toneIcon[tone];

  return (
    <div
      className={[styles.toast, styles[tone]].join(' ')}
      data-toast-id={id}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false);
      }}
    >
      <Icon name={icon} className={styles.icon} />
      <div className={styles.content}>
        <p className={styles.title}>
          <span className={styles.visuallyHidden}>{label}: </span>
          {title}
        </p>
        {message && <div className={styles.message}>{message}</div>}
        {action && (
          <div className={styles.action}>
            {'href' in action ? (
              <Link href={action.href}>{action.label}</Link>
            ) : (
              <Button variant="secondary" size="sm" onClick={action.onClick}>
                {action.label}
              </Button>
            )}
          </div>
        )}
      </div>
      <button type="button" className={styles.dismiss} onClick={dismiss} aria-label={`Dismiss: ${title}`}>
        <Icon name="close" size="sm" />
      </button>
    </div>
  );
}

/** Props for ToastRegion. Controlled: the host app (or useToasts) owns the list of toasts. */
export interface ToastRegionProps {
  /** Oldest first. The newest toast is shown last (nearest the screen edge). */
  toasts: ToastData[];
  /** Called with a toast's id when it is dismissed or times out. */
  onDismiss: (id: string) => void;
  /** Toasts shown before older ones collapse behind "+N more". Default 3. Urgent toasts always show. */
  maxVisible?: number;
  /** Landmark name. Default "Notifications". */
  label?: string;
  /** `fixed` (default): pinned to the block-end edge (inline-end corner from 48rem). `inline`: in the flow, for docs. */
  placement?: 'fixed' | 'inline';
}

/**
 * Place once per page. A labelled region holding two live containers that always exist (so additions
 * are announced): a polite role="status" one for normal toasts and a role="alert" one for `urgent`
 * toasts. Nothing here moves focus.
 *
 * Keeping focused content visible: while toasts are shown (fixed placement), an effect measures how
 * far the stack reaches up from the bottom of the viewport and sets `--toast-stack-size` on <html>;
 * the stylesheet turns that into `scroll-padding-block-end`. Focus and scrollIntoView then stop above
 * the stack instead of under it. Pages with a StickyActionBar lift the stack above the bar automatically;
 * hosts can add `--toast-offset-block-end` for other bars.
 */
export function ToastRegion({ toasts, onDismiss, maxVisible = 3, label = 'Notifications', placement = 'fixed' }: ToastRegionProps) {
  const [expanded, setExpanded] = useState(false);
  const regionRef = useRef<HTMLElement>(null);
  const polite = toasts.filter((t) => !t.urgent);
  const urgent = toasts.filter((t) => t.urgent);
  const room = Math.max(0, maxVisible - urgent.length);
  const hidden = expanded ? 0 : Math.max(0, polite.length - room);
  const shown = polite.slice(hidden);

  useEffect(() => {
    if (polite.length <= room && expanded) setExpanded(false);
  }, [polite.length, room, expanded]);

  useEffect(() => {
    const region = regionRef.current;
    if (placement !== 'fixed' || !region || toasts.length === 0) return;
    const root = document.documentElement;
    const measure = () => root.style.setProperty('--toast-stack-size', `${Math.max(0, window.innerHeight - region.getBoundingClientRect().top)}px`);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(region);
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
      root.style.removeProperty('--toast-stack-size');
    };
  }, [placement, toasts.length]);

  const render = (toast: ToastData) => <Toast key={toast.id} {...toast} onDismiss={onDismiss} />;

  return (
    <section ref={regionRef} aria-label={label} className={[styles.region, styles[placement]].join(' ')} data-has-toasts={toasts.length > 0 || undefined}>
      {hidden > 0 && (
        <button type="button" className={styles.more} aria-expanded={false} onClick={() => setExpanded(true)}>
          +{hidden} more
        </button>
      )}
      {expanded && polite.length > room && (
        <button type="button" className={styles.more} aria-expanded onClick={() => setExpanded(false)}>
          Show fewer
        </button>
      )}
      <div role="status" className={styles.stack}>
        {shown.map(render)}
      </div>
      <div role="alert" className={styles.stack}>
        {urgent.map(render)}
      </div>
    </section>
  );
}
