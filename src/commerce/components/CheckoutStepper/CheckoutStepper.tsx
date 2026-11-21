import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { Icon } from '../../../components/Icon';
import { Link } from '../../../components/Link';
import styles from './CheckoutStepper.module.css';

export interface CheckoutStepperStep {
  id: string;
  label: string;
  /** `complete` steps link back (href and/or onSelect); `upcoming` steps are plain text. */
  state: 'complete' | 'current' | 'upcoming';
  /** Link for a completed step (no-JavaScript fallback, or real routes). */
  href?: string;
}

export interface CheckoutStepperProps {
  /** In order. Exactly one is `current`. The template only marks steps complete when they validate. */
  steps: CheckoutStepperStep[];
  /** Go back to a completed step. */
  onSelect?: (id: string) => void;
  /** Landmark name. Default "Checkout steps". */
  label?: string;
}

/**
 * Ordered list of checkout steps (aria-current="step" on the current one). Completed steps link back;
 * upcoming steps are never links, so nobody can skip past a failing step. Labels always show; on narrow
 * containers the list collapses to "Step 2 of 4: Shipping" plus a link back to the previous step.
 * Step changes after the first render are announced politely.
 */
export function CheckoutStepper({ steps, onSelect, label = 'Checkout steps' }: CheckoutStepperProps) {
  const index = Math.max(0, steps.findIndex((s) => s.state === 'current'));
  const current = steps[index];
  const previous = index > 0 ? steps[index - 1] : undefined;
  const position = current ? `Step ${index + 1} of ${steps.length}: ${current.label}` : '';
  const [announcement, setAnnouncement] = useState('');
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else setAnnouncement(position);
  }, [position]);

  const go = (step: CheckoutStepperStep) => (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onSelect) return;
    event.preventDefault();
    onSelect(step.id);
  };

  return (
    <nav className={styles.root} aria-label={label}>
      <ol className={styles.list}>
        {steps.map((step, i) => (
          <li key={step.id} className={styles.step} data-state={step.state} aria-current={step.state === 'current' ? 'step' : undefined}>
            <span className={styles.marker} aria-hidden="true">
              {step.state === 'complete' ? <Icon name="check" size="sm" /> : i + 1}
            </span>
            {step.state === 'complete' && (step.href || onSelect) ? (
              <Link href={step.href ?? `#${step.id}`} onClick={go(step)} className={styles.label}>
                <span className={styles.visuallyHidden}>Completed: </span>
                {step.label}
              </Link>
            ) : (
              <span className={styles.label}>
                {step.state === 'complete' && <span className={styles.visuallyHidden}>Completed: </span>}
                {step.label}
              </span>
            )}
          </li>
        ))}
      </ol>
      <div className={styles.compact}>
        <p className={styles.position}>{position}</p>
        {previous && previous.state === 'complete' && (previous.href || onSelect) && (
          <Link href={previous.href ?? `#${previous.id}`} onClick={go(previous)} className={styles.back}>
            <Icon name="arrow-left" size="sm" />
            Back to {previous.label.toLowerCase()}
          </Link>
        )}
      </div>
      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </nav>
  );
}
