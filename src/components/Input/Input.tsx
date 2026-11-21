import type { ComponentPropsWithRef, ReactNode } from 'react';
import field from '../fieldBox.module.css';

export type InputType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'date' | 'search';
export type FieldSize = 'sm' | 'md' | 'lg';

export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  type?: InputType;
  size?: FieldSize;
  /** Icon or short text before the value, e.g. <Icon name="mail" /> or "$". Decorative. */
  startAdornment?: ReactNode;
  /** Icon or short text after the value, e.g. "kg". Decorative. */
  endAdornment?: ReactNode;
}

/**
 * Text-like input. Controlled (`value` + `onChange`) or uncontrolled (`defaultValue`); `ref` and all
 * other native props go to the <input>. `className` goes on the visual box. Invalid styling comes
 * from aria-invalid="true" (Field sets it).
 */
export function Input({ type = 'text', size = 'md', startAdornment, endAdornment, className, ...rest }: InputProps) {
  return (
    <div className={[field.box, field[size], className].filter(Boolean).join(' ')}>
      {startAdornment && (
        <span className={field.adornment} aria-hidden="true">
          {startAdornment}
        </span>
      )}
      <input type={type} className={field.control} {...rest} />
      {endAdornment && (
        <span className={field.adornment} aria-hidden="true">
          {endAdornment}
        </span>
      )}
    </div>
  );
}
