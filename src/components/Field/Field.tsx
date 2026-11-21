import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';
import { FieldError, HelpText } from '../HelpText';
import { Label } from '../Label';
import styles from './Field.module.css';

/** Props Field wires onto its control. */
export interface FieldControlProps {
  id: string;
  required?: boolean;
  'aria-describedby'?: string;
  'aria-invalid'?: boolean;
  'aria-required'?: boolean;
}

export interface FieldProps {
  label: ReactNode;
  hint?: ReactNode;
  /** Error text. When present the control gets aria-invalid and the message is described by it. */
  error?: ReactNode;
  required?: boolean;
  optional?: boolean;
  /** Control id. Defaults to a generated one. */
  id?: string;
  /** A single control element (props are merged in), or a render function receiving the props. */
  children: ReactElement<FieldControlProps> | ((props: FieldControlProps) => ReactNode);
  className?: string;
}

/**
 * Label + control + hint + error, with the accessibility wiring done for you: label `for`, `id`,
 * aria-describedby (hint id, then error id, then any ids the control already had), aria-invalid
 * and required / aria-required.
 */
export function Field({ label, hint, error, required, optional, id, children, className }: FieldProps) {
  const generatedId = useId();
  const controlId = id ?? generatedId;
  const hintId = hint ? `${controlId}-hint` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;

  const ownDescribedBy = isValidElement(children) ? children.props['aria-describedby'] : undefined;
  const controlProps: FieldControlProps = {
    id: controlId,
    required: required || undefined,
    'aria-required': required || undefined,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': [hintId, errorId, ownDescribedBy].filter(Boolean).join(' ') || undefined,
  };

  return (
    <div className={[styles.field, className].filter(Boolean).join(' ')}>
      <Label htmlFor={controlId} required={required} optional={optional}>
        {label}
      </Label>
      {typeof children === 'function' ? children(controlProps) : cloneElement(children, controlProps)}
      {hint && <HelpText id={hintId}>{hint}</HelpText>}
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}
