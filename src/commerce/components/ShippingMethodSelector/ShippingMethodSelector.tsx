import { Alert } from '../../../components/Alert';
import { Radio, RadioGroup } from '../../../components/Radio';
import { formatMoney } from '../../../utils/formatMoney';
import type { ShippingMethod } from '../../types/cart';
import styles from './ShippingMethodSelector.module.css';

export interface ShippingMethodSelectorProps {
  methods: ShippingMethod[];
  /** Selected method id. */
  value?: string;
  onChange: (methodId: string) => void;
  /** The method free shipping applies to (e.g. Standard over $75): shown as "Free" and marked. */
  freeMethodId?: string;
  error?: string;
  /** Field name. Default "shippingMethodId". */
  name?: string;
}

/**
 * Shipping methods as radio cards (label and price as the name, estimate and description as the
 * description). The free-shipping method is marked in text. With no methods, an Alert explains.
 */
export function ShippingMethodSelector({ methods, value, onChange, freeMethodId, error, name = 'shippingMethodId' }: ShippingMethodSelectorProps) {
  if (methods.length === 0) {
    return (
      <Alert tone="warning" title="No shipping methods available">
        We can’t ship to this address yet. Check the address, or contact us and we’ll find a way.
      </Alert>
    );
  }
  return (
    <RadioGroup legend="Shipping method" name={name} variant="card" value={value ?? ''} onChange={onChange} error={error} required>
      {methods.map((method) => {
        const free = method.id === freeMethodId || method.price.amount === 0;
        return (
          <Radio
            key={method.id}
            value={method.id}
            label={
              <span className={styles.label}>
                <span>{method.label}</span>
                <span className={styles.price}>{free ? 'Free' : formatMoney(method.price)}</span>
              </span>
            }
            description={
              <>
                {[method.estimate, method.description].filter(Boolean).join(' · ')}
                {method.id === freeMethodId && method.price.amount > 0 && <span className={styles.badge}>Free shipping applied (was {formatMoney(method.price)})</span>}
              </>
            }
          />
        );
      })}
    </RadioGroup>
  );
}
