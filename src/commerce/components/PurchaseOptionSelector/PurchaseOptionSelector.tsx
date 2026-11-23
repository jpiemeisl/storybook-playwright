import { useId } from 'react';
import { Radio, RadioGroup } from '../../../components/Radio';
import { intervalName, purchaseOptionKey, purchaseOptionText, savingsVsMonthly } from '../../logic/options';
import { formatRecurring, subscriptionUnitPrice } from '../../logic/pricing';
import type { Product, PurchaseOption, Variant } from '../../types/product';
import styles from './PurchaseOptionSelector.module.css';

/** Props for PurchaseOptionSelector, the one-time versus subscription choice on a product page. */
export interface PurchaseOptionSelectorProps {
  product: Product;
  variant: Variant;
  value: PurchaseOption;
  onChange: (option: PurchaseOption) => void;
}

const optionsFor = (product: Product) => product.purchaseOptions.filter((o) => (product.kind === 'subscription' ? o.type === 'subscription' : true));

/** Radio cards for one-time and each subscription option, with the per-cycle price. One-time is hidden for subscription products. */
export function PurchaseOptionSelector({ product, variant, value, onChange }: PurchaseOptionSelectorProps) {
  const options = optionsFor(product);
  return (
    <RadioGroup legend="How do you want to buy it?" variant="card" value={purchaseOptionKey(value)} onChange={(key) => onChange(options.find((o) => purchaseOptionKey(o) === key)!)}>
      {options.map((option) => {
        const text = purchaseOptionText(option, variant.price);
        return <Radio key={purchaseOptionKey(option)} value={purchaseOptionKey(option)} label={text.title} description={text.detail} />;
      })}
    </RadioGroup>
  );
}

/** Props for BillingIntervalSelector, the segmented billing interval control for subscription products. */
export interface BillingIntervalSelectorProps {
  product: Product;
  variant: Variant;
  value: PurchaseOption;
  onChange: (option: PurchaseOption) => void;
}

/**
 * Segmented radio control for billing intervals with a savings callout computed from the data ("Save 20%
 * vs monthly"). A fieldset whose legend ("Billing") names the group of native radios.
 */
export function BillingIntervalSelector({ product, variant, value, onChange }: BillingIntervalSelectorProps) {
  const name = useId();
  const options = product.purchaseOptions.filter((o) => o.type === 'subscription');
  return (
    <fieldset className={styles.group}>
      <legend className={styles.legend}>Billing</legend>
      <div className={styles.segments}>
        {options.map((option) => {
          const key = purchaseOptionKey(option);
          const savings = savingsVsMonthly(product, variant, option);
          return (
            <label key={key} className={styles.segment}>
              <input type="radio" className={styles.input} name={name} value={key} checked={purchaseOptionKey(value) === key} onChange={() => onChange(option)} />
              <span className={styles.name}>{intervalName(option.interval)}</span>
              <span className={styles.price}>{formatRecurring(subscriptionUnitPrice(variant.price, option), option.interval)}</span>
              {savings !== null && <span className={styles.savings}>Save {savings}% vs monthly</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
