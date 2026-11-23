import { createContext, useContext, useId, type ComponentPropsWithRef, type ReactNode } from 'react';
import { FieldError, HelpText } from '../HelpText';
import { Icon } from '../Icon';
import styles from './Radio.module.css';

interface RadioGroupContextValue {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  variant: 'default' | 'card';
  required?: boolean;
}

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

/** Props for RadioGroup. Other native `<fieldset>` props go to the fieldset. Children are Radio elements. */
export interface RadioGroupProps extends Omit<ComponentPropsWithRef<'fieldset'>, 'onChange' | 'defaultValue'> {
  /** Visible group label, rendered as the fieldset's `<legend>`. */
  legend: ReactNode;
  /** Shared input name. Defaults to a generated one. */
  name?: string;
  /** Controlled selected value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  /** Called with the value of the option the user selects. */
  onChange?: (value: string) => void;
  /** Stack the options (`vertical`, default) or lay them out in a row (`horizontal`). */
  orientation?: 'vertical' | 'horizontal';
  /** `card`: each option is a bordered, fully clickable card (plans, shipping methods). */
  variant?: 'default' | 'card';
  /** Help text under the legend, linked to the group with aria-describedby. */
  hint?: ReactNode;
  /** Error text under the options. Sets aria-invalid on the group and is linked with aria-describedby. */
  error?: ReactNode;
  /** Sets `required` on every radio and aria-required on the group, and shows a "*" on the legend. */
  required?: boolean;
}

/**
 * Fieldset + legend around native radios sharing one `name`. Arrow keys, Tab and Space are the
 * browser's own radio behaviour; nothing is reimplemented.
 */
export function RadioGroup({
  legend,
  name,
  value,
  defaultValue,
  onChange,
  orientation = 'vertical',
  variant = 'default',
  hint,
  error,
  required,
  className,
  children,
  ...rest
}: RadioGroupProps) {
  const generatedName = useId();
  const hintId = useId();
  const errorId = useId();

  return (
    <RadioGroupContext.Provider
      value={{ name: name ?? generatedName, value, defaultValue, onChange, variant, required }}
    >
      {/* role=radiogroup lets the group carry aria-required / aria-invalid (not allowed on a plain fieldset). */}
      <fieldset
        role="radiogroup"
        className={[styles.group, className].filter(Boolean).join(' ')}
        aria-required={required || undefined}
        aria-invalid={error ? true : undefined}
        aria-describedby={[hint ? hintId : undefined, error ? errorId : undefined].filter(Boolean).join(' ') || undefined}
        {...rest}
      >
        <legend className={styles.legend}>
          {legend}
          {required && (
            <span className={styles.required} aria-hidden="true">
              {' *'}
            </span>
          )}
        </legend>
        {hint && <HelpText id={hintId}>{hint}</HelpText>}
        <div className={[styles.options, styles[orientation], styles[variant]].join(' ')}>{children}</div>
        {error && <FieldError id={errorId}>{error}</FieldError>}
      </fieldset>
    </RadioGroupContext.Provider>
  );
}

/** Props for Radio. `name` and the checked state come from the surrounding RadioGroup; other native `<input>` props go to the input. */
export interface RadioProps extends Omit<ComponentPropsWithRef<'input'>, 'type' | 'name' | 'value' | 'children'> {
  /** Value reported to RadioGroup's `onChange` and submitted with the form. */
  value: string;
  /** Visible label and the radio's accessible name. */
  label: ReactNode;
  /** Secondary text under the label, announced as the radio's description. */
  description?: ReactNode;
}

/** One option. Use inside RadioGroup, which supplies name, checked state and variant. */
export function Radio({ value, label, description, id, className, onChange, ...rest }: RadioProps) {
  const group = useContext(RadioGroupContext);
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const labelId = `${inputId}-label`;
  const descriptionId = description ? `${inputId}-description` : undefined;
  const variant = group?.variant ?? 'default';

  const checkedProps =
    group?.value !== undefined
      ? { checked: group.value === value }
      : group?.defaultValue !== undefined
        ? { defaultChecked: group.defaultValue === value }
        : {};

  return (
    // The whole option (card) is the label, so it is all clickable. aria-labelledby keeps the
    // accessible name to the title; the description is announced as a description instead.
    <label className={[styles.option, styles[`${variant}Option`], className].filter(Boolean).join(' ')}>
      <input
        type="radio"
        id={inputId}
        name={group?.name}
        value={value}
        required={group?.required}
        className={styles.input}
        aria-labelledby={labelId}
        aria-describedby={descriptionId}
        onChange={(event) => {
          onChange?.(event);
          group?.onChange?.(value);
        }}
        {...checkedProps}
        {...rest}
      />
      <span className={styles.text}>
        <span id={labelId} className={styles.label}>
          {label}
        </span>
        {description && (
          <span id={descriptionId} className={styles.description}>
            {description}
          </span>
        )}
      </span>
      {variant === 'card' && <Icon name="check-circle" className={styles.checkedIcon} />}
    </label>
  );
}
