import { useEffect, useId, useRef, useState, type FocusEvent, type FormEvent, type ReactNode } from 'react';
import { collectFormErrors, validateElement, type FieldErrors, type ValidationMessages } from '../../utils/validation';
import { Alert } from '../Alert';
import { Button } from '../Button';
import { Checkbox } from '../Checkbox';
import { Field } from '../Field';
import type { FormStatus } from '../forms';
import { Input } from '../Input';
import { Link } from '../Link';
import { Select, type SelectOption } from '../Select';
import { Textarea } from '../Textarea';
import styles from './ContactForm.module.css';

/** Values ContactForm passes to `onSubmit` once the form is valid. Text values are trimmed. */
export interface ContactFormValues {
  name: string;
  email: string;
  /** Omitted when left empty. */
  phone?: string;
  /** The `value` of the chosen subject option. */
  subject: string;
  message: string;
  /** Only present when `consentLabel` is set (then always true, since the checkbox is required). */
  consent?: boolean;
}

/** Props for ContactForm. The host app sends the message and reports progress through `status`. */
export interface ContactFormProps {
  /** Options for the required Subject select. */
  subjectOptions: SelectOption[];
  /** Called with the values after a valid submit. Not called while `status` is "submitting" or "success". */
  onSubmit: (values: ContactFormValues) => void;
  /** Request state from the host app. "submitting" and "success" disable the fields; "error" and "success" show an alert. */
  status?: FormStatus;
  /** Shown in an urgent alert when `status` is "error". */
  errorMessage?: ReactNode;
  /** Shown in a success alert when `status` is "success". */
  successMessage?: ReactNode;
  /** Shows "Send another message" after success; reset the form and set status back to idle. */
  onReset?: () => void;
  /** Label for a consent checkbox. When given, the checkbox is shown and required. */
  consentLabel?: ReactNode;
  /** Default 2000. */
  messageMaxLength?: number;
  /** Initial field values (the fields are uncontrolled). */
  defaultValues?: Partial<ContactFormValues>;
}

type FieldName = keyof ContactFormValues;

const labels: Record<FieldName, string> = {
  name: 'Full name',
  email: 'Email address',
  phone: 'Phone number',
  subject: 'Subject',
  message: 'Message',
  consent: 'consent',
};

const messages: Partial<Record<FieldName, ValidationMessages>> = {
  name: { valueMissing: 'Enter your full name' },
  email: { valueMissing: 'Enter your email address' },
  subject: { valueMissing: 'Choose a subject' },
  message: { valueMissing: 'Enter your message', tooShort: 'Message must be 10 characters or more' },
  consent: { valueMissing: 'Tick the box to agree before sending' },
};

/**
 * Presentational contact form. Validation: native constraints with noValidate; checked on submit and,
 * after the first submit, on blur. A failed submit shows an error summary (focused, role="alert") with
 * links that move focus to each invalid field. After success the values stay visible but disabled;
 * `onReset` adds a "Send another message" button.
 */
export function ContactForm({
  subjectOptions,
  onSubmit,
  status = 'idle',
  errorMessage = 'Your message could not be sent. Please try again in a few minutes.',
  successMessage = 'Thanks for getting in touch. We’ll reply within one working day.',
  onReset,
  consentLabel,
  messageMaxLength = 2000,
  defaultValues = {},
}: ContactFormProps) {
  const formId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const summaryRef = useRef<HTMLDivElement>(null);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [showSummary, setShowSummary] = useState(false);
  const locked = status === 'submitting' || status === 'success';
  const idFor = (name: FieldName) => `${formId}-${name}`;

  // Move focus to the summary after each failed submit so it is announced and easy to act on.
  useEffect(() => {
    if (showSummary) summaryRef.current?.focus();
  }, [submitCount, showSummary]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (locked) return;
    const form = event.currentTarget;
    const found = collectFormErrors(form, labels, messages);
    setErrors(found);
    setSubmitCount((count) => count + 1);
    if (Object.keys(found).length > 0) {
      setShowSummary(true);
      return;
    }
    setShowSummary(false);
    const data = new FormData(form);
    const text = (name: string) => String(data.get(name) ?? '').trim();
    onSubmit({
      name: text('name'),
      email: text('email'),
      phone: text('phone') || undefined,
      subject: text('subject'),
      message: text('message'),
      consent: consentLabel ? data.get('consent') === 'on' : undefined,
    });
  };

  const handleBlur = (event: FocusEvent<HTMLFormElement>) => {
    // Blur bubbles from the control that lost focus.
    const target = event.target as Element;
    const name = target.getAttribute('name') as FieldName | null;
    if (submitCount === 0 || !name || !(name in labels)) return;
    const message = validateElement(target, labels[name], messages[name]);
    setErrors(({ [name]: _, ...rest }) => (message ? { ...rest, [name]: message } : rest));
  };

  const reset = () => {
    formRef.current?.reset();
    setErrors({});
    setSubmitCount(0);
    setShowSummary(false);
    onReset?.();
  };

  // Always list errors in form order, however they were added or re-validated.
  const errorEntries = (Object.keys(labels) as FieldName[])
    .filter((name) => errors[name])
    .map((name) => [name, errors[name]!] as const);

  return (
    <form ref={formRef} noValidate onSubmit={handleSubmit} onBlur={handleBlur} className={styles.form}>
      {showSummary && errorEntries.length > 0 && (
        <Alert ref={summaryRef} tabIndex={-1} tone="danger" urgent title="There is a problem">
          <ul className={styles.summaryList}>
            {errorEntries.map(([name, message]) => (
              <li key={name}>
                <Link
                  href={`#${idFor(name)}`}
                  onClick={(event) => {
                    event.preventDefault();
                    document.getElementById(idFor(name))?.focus();
                  }}
                >
                  {message}
                </Link>
              </li>
            ))}
          </ul>
        </Alert>
      )}
      {status === 'error' && (
        <Alert tone="danger" urgent title="Message not sent">
          {errorMessage}
        </Alert>
      )}
      {status === 'success' && (
        <Alert tone="success" title="Message sent">
          {successMessage}
        </Alert>
      )}

      <p className={styles.note}>
        Required fields are marked with an asterisk (<span aria-hidden="true">*</span>
        <span className={styles.visuallyHidden}>star</span>).
      </p>

      <fieldset className={styles.fields} disabled={locked}>
        <legend className={styles.visuallyHidden}>Your message</legend>
        <Field id={idFor('name')} label={labels.name} required error={errors.name}>
          <Input name="name" autoComplete="name" defaultValue={defaultValues.name} />
        </Field>
        <Field id={idFor('email')} label={labels.email} required error={errors.email} hint="We’ll only use this to reply.">
          <Input name="email" type="email" autoComplete="email" inputMode="email" defaultValue={defaultValues.email} />
        </Field>
        <Field id={idFor('phone')} label={labels.phone} optional error={errors.phone}>
          <Input name="phone" type="tel" autoComplete="tel" inputMode="tel" defaultValue={defaultValues.phone} />
        </Field>
        <Field id={idFor('subject')} label={labels.subject} required error={errors.subject}>
          <Select name="subject" placeholder="Choose a subject" options={subjectOptions} defaultValue={defaultValues.subject} />
        </Field>
        <Field
          id={idFor('message')}
          label={labels.message}
          required
          error={errors.message}
          hint="Include any order or invoice numbers."
          className={styles.full}
        >
          <Textarea
            name="message"
            rows={6}
            autoGrow
            showCount
            minLength={10}
            maxLength={messageMaxLength}
            defaultValue={defaultValues.message}
          />
        </Field>
        {consentLabel && (
          <Checkbox
            id={idFor('consent')}
            name="consent"
            required
            label={consentLabel}
            error={errors.consent}
            defaultChecked={defaultValues.consent}
            className={styles.full}
          />
        )}
      </fieldset>

      <div className={styles.actions}>
        <Button type="submit" loading={status === 'submitting'} disabled={status === 'success'}>
          Send message
        </Button>
        {status === 'success' && onReset && (
          <Button variant="secondary" onClick={reset}>
            Send another message
          </Button>
        )}
      </div>
    </form>
  );
}
