import type { ComponentPropsWithRef, ReactNode } from 'react';
import field from '../fieldBox.module.css';

/** Native input types Input supports: the text-like ones. Use Checkbox or Radio for the others. */
export type InputType = 'text' | 'email' | 'tel' | 'url' | 'password' | 'number' | 'date' | 'search';
/** Height, padding and font size of a form control box (shared by Input, Select and SearchInput). */
export type FieldSize = 'sm' | 'md' | 'lg';

/** Props for Input. Native `<input>` props go to the input; `size` is the visual size, not the native attribute. */
export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type'> {
  /** Native input type. Default "text". */
  type?: InputType;
  /** Visual size of the box. Default "md". */
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
