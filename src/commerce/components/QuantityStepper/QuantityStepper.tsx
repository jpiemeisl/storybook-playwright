import { useEffect, useId, useState } from 'react';
import { Icon } from '../../../components/Icon';
import styles from './QuantityStepper.module.css';

/** Props for QuantityStepper; works controlled (`value`) or uncontrolled (`defaultValue`). */
export interface QuantityStepperProps {
  /** Controlled value. */
  value?: number;
  /** Uncontrolled initial value. Default 1. */
  defaultValue?: number;
  onChange?: (quantity: number) => void;
  /** Lowest allowed quantity. Default 1. */
  min?: number;
  /** Hard upper limit. Default 99. */
  max?: number;
  /** Units in stock; caps the value and explains why ("Only 3 available"). */
  maxFromStock?: number;
  /** Used in button names: "Increase quantity of Stoneware mug". */
  productTitle: string;
  /** Field name for forms. Default "quantity". */
  name?: string;
}

/**
 * Minus / number input / plus. The input works on its own without JavaScript (min, max). Buttons are
 * disabled at the limits, with a visible reason when stock is the limit. Changes are announced politely;
 * invalid typing reverts on blur.
 */
export function QuantityStepper({ value, defaultValue = 1, onChange, min = 1, max = 99, maxFromStock, productTitle, name = 'quantity' }: QuantityStepperProps) {
  const inputId = useId();
  const reasonId = useId();
  const upper = Math.max(min, Math.min(max, maxFromStock ?? max));
  const [internal, setInternal] = useState(defaultValue);
  const current = Math.min(upper, Math.max(min, value ?? internal));
  const [draft, setDraft] = useState(String(current));
  const [announcement, setAnnouncement] = useState('');

  useEffect(() => setDraft(String(current)), [current]);

  const commit = (next: number) => {
    const clamped = Math.min(upper, Math.max(min, next));
    if (value === undefined) setInternal(clamped);
    setDraft(String(clamped));
    if (clamped !== current) {
      onChange?.(clamped);
      setAnnouncement(`Quantity ${clamped}`);
    }
  };

  const stockLimited = maxFromStock !== undefined && maxFromStock <= max && current >= upper;

  return (
    <div className={styles.root}>
      <label htmlFor={inputId} className={styles.label}>
        Quantity
      </label>
      <div className={styles.control}>
        <button type="button" className={styles.button} aria-label={`Decrease quantity of ${productTitle}`} disabled={current <= min} onClick={() => commit(current - 1)}>
          <Icon name="minus" size="sm" />
        </button>
        <input
          id={inputId}
          className={styles.input}
          type="number"
          inputMode="numeric"
          name={name}
          min={min}
          max={upper}
          value={draft}
          aria-describedby={stockLimited ? reasonId : undefined}
          onChange={(event) => {
            setDraft(event.target.value);
            const n = Number(event.target.value);
            if (event.target.value !== '' && Number.isInteger(n) && n >= min && n <= upper) commit(n);
          }}
          onBlur={() => setDraft(String(current))}
        />
        <button type="button" className={styles.button} aria-label={`Increase quantity of ${productTitle}`} disabled={current >= upper} aria-describedby={stockLimited ? reasonId : undefined} onClick={() => commit(current + 1)}>
          <Icon name="plus" size="sm" />
        </button>
      </div>
      {stockLimited && (
        <p id={reasonId} className={styles.reason}>
          Only {maxFromStock} available
        </p>
      )}
      <span className={styles.visuallyHidden} role="status">
        {announcement}
      </span>
    </div>
  );
}
