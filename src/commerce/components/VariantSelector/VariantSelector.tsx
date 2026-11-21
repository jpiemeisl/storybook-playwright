import { useId } from 'react';
import { Field } from '../../../components/Field';
import { Select } from '../../../components/Select';
import { optionDisplay } from '../../logic/options';
import { getOptionAvailability, type OptionAvailability, type Selection } from '../../logic/variants';
import type { Product, ProductOption } from '../../types/product';
import styles from './VariantSelector.module.css';

export interface VariantSelectorProps {
  product: Product;
  selection: Selection;
  onChange: (optionName: string, value: string) => void;
}

const stateText: Record<OptionAvailability, string> = { 'in-stock': '', 'out-of-stock': 'sold out', none: 'not available with the other options chosen' };

/**
 * One group per option: buttons, swatches (colour plus text) or a select, per the option's `display`
 * (12+ values default to a select). Buttons and swatches are native radios: arrow keys move between
 * values and disabled values are skipped. Sold-out values stay selectable (the variant exists); values
 * with no variant in the current combination are disabled. Both states are in the accessible name.
 */
export function VariantSelector({ product, selection, onChange }: VariantSelectorProps) {
  const availability = getOptionAvailability(product, selection);
  return (
    <div className={styles.root}>
      {product.options.map((option) => (
        <OptionGroup key={option.name} option={option} value={selection[option.name]} availability={availability[option.name] ?? {}} onChange={(value) => onChange(option.name, value)} />
      ))}
    </div>
  );
}

function OptionGroup({ option, value, availability, onChange }: { option: ProductOption; value?: string; availability: Record<string, OptionAvailability>; onChange: (value: string) => void }) {
  const name = useId();
  const display = optionDisplay(option);

  if (display === 'select') {
    return (
      <Field label={`${option.name}: ${value ?? 'choose'}`}>
        <Select
          value={value ?? ''}
          placeholder={`Choose ${option.name.toLowerCase()}`}
          onChange={(event) => onChange(event.target.value)}
          options={option.values.map((v) => ({ value: v, label: availability[v] && availability[v] !== 'in-stock' ? `${v} (${stateText[availability[v]!]})` : v, disabled: availability[v] === 'none' }))}
        />
      </Field>
    );
  }

  return (
    <fieldset className={styles.group} role="radiogroup" aria-label={option.name}>
      <legend className={styles.legend}>
        {option.name}: <span className={styles.selected}>{value ?? 'choose one'}</span>
      </legend>
      <div className={[styles.values, styles[display]].join(' ')}>
        {option.values.map((v) => {
          const state = availability[v] ?? 'none';
          const colour = display === 'swatches' ? option.swatches?.[v] : undefined;
          return (
            <label key={v} className={[styles.value, styles[state]].join(' ')}>
              <input
                type="radio"
                className={styles.input}
                name={name}
                value={v}
                checked={value === v}
                disabled={state === 'none'}
                aria-label={state === 'in-stock' ? undefined : `${v}, ${stateText[state]}`}
                onChange={() => onChange(v)}
              />
              {colour && <span className={styles.swatch} style={{ backgroundColor: colour }} aria-hidden="true" />}
              <span className={styles.text}>{v}</span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
