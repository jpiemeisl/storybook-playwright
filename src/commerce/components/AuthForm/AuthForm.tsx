/*
 * Shared pieces of the four auth forms: the form shell (real POST form, error summary, server error and
 * success states), a password field with a show/hide toggle, and the password checklist.
 */
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Alert } from '../../../components/Alert';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Icon } from '../../../components/Icon';
import { Input } from '../../../components/Input';
import { Link } from '../../../components/Link';
import type { AuthErrors } from '../../logic/authForms';
import type { PasswordCheck } from '../../logic/password';
import styles from './AuthForm.module.css';

/** Submission state of an auth form, set by the host: `error` shows the server error, `success` replaces the fields with the success content. */
export type AuthStatus = 'idle' | 'submitting' | 'error' | 'success';

/** Props every auth form shares. */
export interface AuthFormBaseProps<V> {
  /** Form action for the no-JavaScript POST. Default "" (the current URL). */
  action?: string;
  /** Host-provided hidden inputs, e.g. a CSRF token: <input type="hidden" name="csrf" value="…" />. */
  hiddenFields?: ReactNode;
  /** JavaScript path: called with valid values instead of the native POST. */
  onSubmit?: (values: V) => void;
  status?: AuthStatus;
  /** Server error, shown when status is `error`. Keep it generic (see GENERIC_LOGIN_ERROR). */
  errorMessage?: ReactNode;
}

interface ShellProps {
  action: string;
  hiddenFields?: ReactNode;
  /** Field key → element id, in form order, for the error summary links. */
  fieldIds: Record<string, string>;
  /** Current client-side errors (all of them; shown after the first failed submit). */
  errors: AuthErrors;
  /** True when the JavaScript path handles the submit (onSubmit given). */
  enhanced: boolean;
  onValid: () => void;
  status: AuthStatus;
  serverError?: ReactNode;
  submitLabel: string;
  /** The fields; receives the errors to show (empty until the first failed submit). */
  children: (shown: AuthErrors) => ReactNode;
  /** Shown instead of the form fields when status is `success`. */
  success?: ReactNode;
  /** Shown above the error alert (e.g. an expired-link notice). */
  notice?: ReactNode;
}

/**
 * The form: method="post" with named fields, so it works without JavaScript. Submitting validates;
 * with errors the native submit is stopped, an error summary (role="alert") takes focus and links to
 * each field. A server error (status `error`) takes focus too. Valid forms either call onValid (the
 * JavaScript path) or submit natively.
 */
export function AuthFormShell({ action, hiddenFields, fieldIds, errors, enhanced, onValid, status, serverError, submitLabel, children, success, notice }: ShellProps) {
  const [attempts, setAttempts] = useState(0);
  const summaryRef = useRef<HTMLDivElement>(null);
  const serverRef = useRef<HTMLDivElement>(null);
  const shownErrors = attempts > 0 ? Object.entries(errors).filter(([, m]) => m) : [];

  useEffect(() => {
    if (attempts > 0) summaryRef.current?.focus();
  }, [attempts]);
  useEffect(() => {
    if (status === 'error') serverRef.current?.focus();
  }, [status]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    if (status === 'submitting') return event.preventDefault();
    if (Object.values(errors).some(Boolean)) {
      event.preventDefault();
      setAttempts((n) => n + 1);
      return;
    }
    setAttempts(0);
    if (enhanced) {
      event.preventDefault();
      onValid();
    }
  };

  if (status === 'success' && success) return <div className={styles.form}>{success}</div>;

  return (
    <form method="post" action={action} noValidate onSubmit={submit} className={styles.form}>
      {hiddenFields}
      {notice}
      {shownErrors.length > 0 && (
        <Alert ref={summaryRef} tabIndex={-1} tone="danger" urgent title="There is a problem">
          <ul className={styles.summaryList}>
            {shownErrors.map(([key, message]) => (
              <li key={key}>
                <Link
                  href={`#${fieldIds[key]}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(fieldIds[key]!)?.focus();
                  }}
                >
                  {message}
                </Link>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {status === 'error' && serverError && (
        <Alert ref={serverRef} tabIndex={-1} tone="danger" urgent title="That didn’t work">
          {serverError}
        </Alert>
      )}
      {children(Object.fromEntries(shownErrors))}
      <Button type="submit" size="lg" loading={status === 'submitting'} className={styles.submit}>
        {submitLabel}
      </Button>
    </form>
  );
}

/** Props for PasswordField, the password input with a show/hide toggle used by the auth forms. */
export interface PasswordFieldProps {
  /** Id of the input; also the target of error summary links. */
  id: string;
  name: string;
  label: string;
  /** "current-password" (sign in) or "new-password" (register, reset). */
  autoComplete: 'current-password' | 'new-password';
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  hint?: ReactNode;
  /** Extra description ids, e.g. the checklist. */
  describedBy?: string;
}

/**
 * Password input with a show/hide toggle: a real button with aria-pressed and a constant name
 * ("Show password"). The value is only ever the user's typing (never pre-filled) and is shown as text
 * only while the user has pressed the toggle.
 */
export function PasswordField({ id, name, label, autoComplete, value, onChange, onBlur, error, hint, describedBy }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  return (
    <div className={styles.password}>
      <Field id={id} label={label} required error={error} hint={hint}>
        {(control) => (
          <div className={styles.passwordRow}>
            <Input
              {...control}
              aria-describedby={[control['aria-describedby'], describedBy].filter(Boolean).join(' ') || undefined}
              type={visible ? 'text' : 'password'}
              name={name}
              autoComplete={autoComplete}
              spellCheck={false}
              autoCapitalize="none"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onBlur={onBlur}
              className={styles.passwordInput}
            />
            <button type="button" className={styles.toggle} aria-pressed={visible} aria-controls={id} onClick={() => setVisible((v) => !v)}>
              <Icon name={visible ? 'eye-off' : 'eye'} size="sm" />
              <span>Show password</span>
            </button>
          </div>
        )}
      </Field>
    </div>
  );
}

/**
 * The password rules as a list: each item says "met" or "not met" in text (icons are decorative).
 * The list itself is not live, so typing is not announced keystroke by keystroke; the form announces a
 * summary through `announcement` (on blur, and once when every rule becomes met).
 */
export function PasswordChecklist({ id, checks, announcement }: { id: string; checks: PasswordCheck[]; announcement: string }) {
  return (
    <div className={styles.checklist}>
      <p className={styles.checklistTitle} id={`${id}-title`}>
        Your password needs:
      </p>
      <ul id={id} aria-labelledby={`${id}-title`}>
        {checks.map((check) => (
          <li key={check.id} data-passed={check.passed || undefined}>
            <Icon name={check.passed ? 'check-circle' : 'close'} size="sm" />
            <span>{check.label}</span>
            <span className={styles.visuallyHidden}>{check.passed ? ': met' : ': not met yet'}</span>
          </li>
        ))}
      </ul>
      <p role="status" className={styles.visuallyHidden}>
        {announcement}
      </p>
    </div>
  );
}
