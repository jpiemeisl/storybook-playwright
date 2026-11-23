import { useId, type ComponentPropsWithRef, type ReactNode, type Ref } from 'react';
import { FieldError } from '../HelpText';
import { Icon } from '../Icon';
import styles from './Checkbox.module.css';

/** Props for Checkbox. Native `<input>` props (including `ref` and `required`) go to the input; `className` goes on the wrapper. */
export interface CheckboxProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'children'> {
  /** Visible label. Shows a "*" when `required` is set. */
  label: ReactNode;
  /** Secondary text under the label, linked with aria-describedby. */
  description?: ReactNode;
  /** Mixed state ("some selected"). Set as a DOM property; announced as "mixed". */
  indeterminate?: boolean;
  /** Error text under the label. Sets aria-invalid and is linked with aria-describedby. */
  error?: ReactNode;
}

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value);
  else if (ref) ref.current = value;
}

/**
 * Native checkbox styled with appearance:none (focus ring and forced-colors still work), label,
 * optional description and error. Controlled (`checked`) or uncontrolled (`defaultChecked`).
 */
export function Checkbox({
  label,
  description,
  indeterminate = false,
  error,
  id,
  className,
  ref,
  'aria-describedby': describedBy,
  ...rest
}: CheckboxProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;

  return (
    <div className={[styles.checkbox, className].filter(Boolean).join(' ')}>
      <span className={styles.control}>
        <input
          // indeterminate is a DOM property only. Setting it in the ref callback applies it at commit,
          // on every render, so it never lags behind (an effect would run after paint).
          ref={(element) => {
            if (element) element.indeterminate = indeterminate;
            assignRef(ref, element);
          }}
          type="checkbox"
          id={inputId}
          className={styles.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={[descriptionId, errorId, describedBy].filter(Boolean).join(' ') || undefined}
          {...rest}
        />
        <Icon name="check" size="sm" className={[styles.mark, styles.check].join(' ')} />
        <Icon name="minus" size="sm" className={[styles.mark, styles.dash].join(' ')} />
      </span>
      <span className={styles.text}>
        <label htmlFor={inputId} className={styles.label}>
          {label}
          {rest.required && (
            <span className={styles.required} aria-hidden="true">
              {' *'}
            </span>
          )}
        </label>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </span>
    </div>
  );
}
