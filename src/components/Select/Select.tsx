import type { ComponentPropsWithRef } from 'react';
import { Icon } from '../Icon';
import type { FieldSize } from '../Input';
import field from '../fieldBox.module.css';
import styles from './Select.module.css';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectOptionGroup {
  label: string;
  options: SelectOption[];
}

export interface SelectProps extends Omit<ComponentPropsWithRef<'select'>, 'size' | 'multiple'> {
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
