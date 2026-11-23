import type { ReactNode } from 'react';
import { Field } from '../../../components/Field';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';
import { addressLabels } from '../../logic/checkout';
import { US_STATES } from '../../logic/usStates';
import type { CheckoutErrors } from '../../types/checkout';
import type { Address } from '../../types/order';
import styles from './AddressForm.module.css';

type AddressField = Exclude<keyof Address, 'country'>;

/** Props for AddressForm, the controlled US address fieldset used in checkout and the address book. */
export interface AddressFormProps {
  /** `shipping` or `billing`: sets the autocomplete section tokens and which error keys are read. */
  section: 'shipping' | 'billing';
  /** Prefix for field ids, unique per form on the page: ids are "<idPrefix>-<field>", e.g. "shipping-city". */
  idPrefix: string;
  value: Partial<Address>;
  /** CheckoutErrors; this form reads "shippingAddress.<field>" or "billingAddress.<field>". */
  errors?: CheckoutErrors;
  /** Called with the whole updated address (country is always "US"). */
  onChange: (address: Partial<Address>) => void;
  /** Fieldset legend. Default "Shipping address" / "Billing address". */
  legend?: ReactNode;
  disabled?: boolean;
}

const stateOptions = US_STATES.map((s) => ({ value: s.code, label: s.name }));

/** The id AddressForm gives a field, so error summaries can link to it. */
export const addressFieldId = (idPrefix: string, field: AddressField) => `${idPrefix}-${field}`;

/**
 * US-only address fields with the right autocomplete tokens per section ("shipping address-line1",
 * "billing postal-code", ...). State is a Select of the 50 states plus DC stored as 2-letter codes; ZIP
 * takes 5 digits or ZIP+4 (inputMode numeric); phone is optional (type tel). Country is fixed and shown
 * as text. Controlled: values and errors come in, every change goes out through onChange.
 */
export function AddressForm({ section, idPrefix, value, errors = {}, onChange, legend, disabled }: AddressFormProps) {
  const prefix = section === 'shipping' ? 'shippingAddress' : 'billingAddress';
  const set = (field: AddressField) => (next: string) => onChange({ ...value, [field]: next, country: 'US' });
  const field = (name: AddressField) => ({ id: addressFieldId(idPrefix, name), label: addressLabels[name], error: errors[`${prefix}.${name}`] });
  const ac = (token: string) => `${section} ${token}`;
  const text = (name: AddressField, autoComplete: string, extra: Record<string, unknown> = {}) => (
    <Input name={`${prefix}.${name}`} autoComplete={ac(autoComplete)} value={value[name] ?? ''} onChange={(e) => set(name)(e.target.value)} {...extra} />
  );

  return (
    <fieldset className={styles.root} disabled={disabled}>
      <legend className={styles.legend}>{legend ?? (section === 'shipping' ? 'Shipping address' : 'Billing address')}</legend>
      <p className={styles.country}>
        Country: <strong>United States</strong>
      </p>
      <div className={styles.grid}>
        <Field {...field('name')} required className={styles.full}>
          {text('name', 'name')}
        </Field>
        <Field {...field('company')} optional className={styles.full}>
          {text('company', 'organization')}
        </Field>
        <Field {...field('line1')} required className={styles.full}>
          {text('line1', 'address-line1')}
        </Field>
        <Field {...field('line2')} optional className={styles.full}>
          {text('line2', 'address-line2')}
        </Field>
        <Field {...field('city')} required className={styles.city}>
          {text('city', 'address-level2')}
        </Field>
        <Field {...field('region')} required className={styles.state}>
          <Select name={`${prefix}.region`} autoComplete={ac('address-level1')} placeholder="Choose a state" options={stateOptions} value={value.region ?? ''} onChange={(e) => set('region')(e.target.value)} />
        </Field>
        <Field {...field('postalCode')} required hint="5 digits, or ZIP+4" className={styles.zip}>
          {text('postalCode', 'postal-code', { inputMode: 'numeric', pattern: '\\d{5}(-\\d{4})?', maxLength: 10 })}
        </Field>
        <Field {...field('phone')} optional hint="Only used if there is a problem with delivery." className={styles.full}>
          {text('phone', 'tel', { type: 'tel', inputMode: 'tel' })}
        </Field>
      </div>
    </fieldset>
  );
}
