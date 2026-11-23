import type { ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';
import type { FieldSize } from '../Input';
import field from '../fieldBox.module.css';
import styles from './Select.module.css';

/** One `<option>` in a Select. `value` must be unique within the Select (used as the key). */
export interface SelectOption {
  value: string;
  /** Visible option text. */
  label: string;
  disabled?: boolean;
}

/** A labeled group of options, rendered as an `<optgroup>`. */
export interface SelectOptionGroup {
  /** Group label shown above its options. */
  label: string;
  options: SelectOption[];
}

/** Props for Select. Native `<select>` props go to the select (single selection only); `className` goes on the visual box. */
export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'size' | 'multiple'> {
  /** Visual size of the box. Default "md". */
  size?: FieldSize;
  /** Options and/or <optgroup> groups. Alternatively pass <option> children. */
  options?: (SelectOption | SelectOptionGroup)[];
  /** First, unselectable option with an empty value. With `required`, leaving it fails validation. */
  placeholder?: string;
}

const renderOption = (option: SelectOption) => (
  <option key={option.value} value={option.value} disabled={option.disabled}>
    {option.label}
  </option>
);

/** Native <select> with the field look and an Icon chevron. Controlled or uncontrolled. */
export function Select({ size = 'md', options, placeholder, className, children, value, defaultValue, ...rest }: SelectProps) {
  // Uncontrolled with a placeholder and no default: start on the placeholder.
  const initial = value === undefined && defaultValue === undefined && placeholder !== undefined ? '' : defaultValue;
  return (
    <div className={[field.box, field[size], styles.box, className].filter(Boolean).join(' ')}>
      <select className={[field.control, styles.select].join(' ')} value={value} defaultValue={initial} {...rest}>
        {placeholder !== undefined && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((item) =>
          'options' in item ? (
            <optgroup key={item.label} label={item.label}>
              {item.options.map(renderOption)}
            </optgroup>
          ) : (
            renderOption(item)
          ),
        )}
        {children}
      </select>
      <Icon name="chevron-down" size="sm" className={styles.chevron} />
    </div>
  );
}
