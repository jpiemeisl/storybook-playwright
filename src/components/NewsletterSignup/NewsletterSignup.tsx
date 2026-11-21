import { useState, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { collectFormErrors, validateElement, type FieldErrors } from '../../utils/validation';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Field } from '../Field';
import type { FormStatus } from '../forms';
import { Input } from '../Input';
import styles from './NewsletterSignup.module.css';

export interface NewsletterValues {
  email: string;
  name?: string;
  consent?: boolean;
}

export interface NewsletterSignupProps {
  onSubmit: (values: NewsletterValues) => void;
  status?: FormStatus;
  errorMessage?: ReactNode;
  successMessage?: ReactNode;
  /** `inline`: fields and button in one row (stacks on narrow slots). `stacked`: one per row. */
  layout?: 'inline' | 'stacked';
  /** Add an optional name field. */
  showName?: boolean;
  /** Label for a consent checkbox. When given, the checkbox is shown and required. */
  consentLabel?: ReactNode;
  submitLabel?: string;
}

const labels = { email: 'Email address', name: 'First name', consent: 'consent' };
const messages = {
  email: { valueMissing: 'Enter your email address' },
  consent: { valueMissing: 'Tick the box to agree before subscribing' },
};

/** Presentational sign-up form: validates natively, calls onSubmit, renders the status it is given. */
export function NewsletterSignup({
  onSubmit,
  status = 'idle',
  errorMessage = 'Something went wrong. Please try again.',
  successMessage = 'Thanks! Check your inbox to confirm your subscription.',
  layout = 'inline',
  showName = false,
  consentLabel,
  submitLabel = 'Subscribe',
}: NewsletterSignupProps) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  if (status === 'success') {
    return (
      <Alert tone="success" title="You’re subscribed">
        {successMessage}
      </Alert>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'submitting') return;
    const form = event.currentTarget;
    const found = collectFormErrors(form, labels, messages);
    setSubmitted(true);
    setErrors(found);
    const first = Object.keys(found)[0];
    if (first) {
      form.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
      return;
    }
    const data = new FormData(form);
    onSubmit({
      email: String(data.get('email') ?? ''),
      name: showName ? String(data.get('name') ?? '') || undefined : undefined,
      consent: consentLabel ? data.get('consent') === 'on' : undefined,
    });
  };

  // After the first submit, re-check a field when the user leaves it.
  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    // Blur bubbles from the control that lost focus.
    const target = event.target as Element;
    const name = target.getAttribute('name');
    if (!submitted || !name) return;
    const message = validateElement(target, labels[name as keyof typeof labels] ?? name, messages[name as keyof typeof messages]);
    setErrors(({ [name]: _, ...rest }) => (message ? { ...rest, [name]: message } : rest));
  };

  return (
    <form noValidate onSubmit={handleSubmit} onBlur={handleBlur} className={[styles.form, styles[layout]].join(' ')}>
      {status === 'error' && (
        <Alert tone="danger" urgent title="Subscription failed">
          {errorMessage}
        </Alert>
      )}
      <div className={styles.row}>
        {showName && (
          <Field label={labels.name} optional error={errors.name}>
            <Input name="name" autoComplete="given-name" />
          </Field>
        )}
        <Field label={labels.email} required error={errors.email}>
          <Input name="email" type="email" autoComplete="email" inputMode="email" />
        </Field>
        <Button type="submit" loading={status === 'submitting'} className={styles.submit}>
          {submitLabel}
        </Button>
      </div>
      {consentLabel && <Checkbox name="consent" required label={consentLabel} error={errors.consent} />}
    </form>
  );
}
