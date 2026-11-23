import type { ReactNode } from 'react';
import { Icon } from '../../../components/Icon';
import { Radio, RadioGroup } from '../../../components/Radio';
import type { CheckoutValues } from '../../types/checkout';
import styles from './PaymentMethodSelector.module.css';

type PaymentMethod = NonNullable<CheckoutValues['paymentMethod']>;

/** Props for PaymentMethodSelector, the card or wallet choice in checkout. */
export interface PaymentMethodSelectorProps {
  value?: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  /**
   * Rendered under the selected method. SECURITY: this library never renders card number, expiry or CVC
   * inputs. Production hosts must put their payment provider's hosted fields (iframes) here, so card data
   * never touches this code. Use DemoPaymentFields in demos.
   */
  paymentFields?: ReactNode;
  /** Validation message shown for the group, e.g. when no method is chosen. */
  error?: string;
  /** Field name. Default "paymentMethod". */
  name?: string;
}

const methods: { value: PaymentMethod; label: string; description: string; icon: 'credit-card' | 'wallet' }[] = [
  { value: 'card', label: 'Credit or debit card', description: 'Card details are entered securely with our payment provider.', icon: 'credit-card' },
  { value: 'wallet', label: 'Digital wallet', description: 'Pay with the wallet on your device. You confirm on the next screen.', icon: 'wallet' },
];

/**
 * Card or wallet as radio cards, with a `paymentFields` slot below the selection. Contains no text inputs
 * of its own (see the security rule on `paymentFields`).
 */
export function PaymentMethodSelector({ value, onChange, paymentFields, error, name = 'paymentMethod' }: PaymentMethodSelectorProps) {
  const selected = methods.find((m) => m.value === value);
  return (
    <div className={styles.root}>
      <RadioGroup legend="Payment method" name={name} variant="card" value={value ?? ''} onChange={(v) => onChange(v as PaymentMethod)} error={error} required>
        {methods.map((m) => (
          <Radio
            key={m.value}
            value={m.value}
            label={
              <span className={styles.label}>
                <Icon name={m.icon} />
                {m.label}
              </span>
            }
            description={m.description}
          />
        ))}
      </RadioGroup>
      {selected && paymentFields && (
        <section className={styles.fields} aria-label={`${selected.label} details`}>
          {paymentFields}
        </section>
      )}
    </div>
  );
}

/** DEMO ONLY: a static panel standing in for the provider's hosted payment fields. No inputs. */
export function DemoPaymentFields() {
  return (
    <div className={styles.demo}>
      <Icon name="lock" />
      <p>
        Payment fields from your payment provider appear here. <strong>Demo only: no payment is taken.</strong>
      </p>
    </div>
  );
}
