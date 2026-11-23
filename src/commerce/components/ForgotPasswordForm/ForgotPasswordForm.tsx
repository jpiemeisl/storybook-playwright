import { useId, useState } from 'react';
import { Alert } from '../../../components/Alert';
import { Field } from '../../../components/Field';
import { Input } from '../../../components/Input';
import { Link } from '../../../components/Link';
import { validateForgotPassword, type ForgotPasswordValues } from '../../logic/authForms';
import { AuthFormShell, type AuthFormBaseProps } from '../AuthForm';
import styles from '../AuthForm/AuthForm.module.css';

/** Props for ForgotPasswordForm, the request-a-reset-link form. */
export interface ForgotPasswordFormProps extends AuthFormBaseProps<ForgotPasswordValues> {
  /** The email the request was made for, for the neutral success message. */
  email?: string;
  links?: { signIn?: string };
}

/**
 * Request a password reset: email only (field "email"). The success state is neutral and never says
 * whether an account exists: "If an account exists for <email>, a reset link has been sent".
 */
export function ForgotPasswordForm({ action = '', hiddenFields, onSubmit, status = 'idle', errorMessage = 'We couldn’t send the request. Try again in a few minutes.', email, links = {} }: ForgotPasswordFormProps) {
  const id = useId();
  const [values, setValues] = useState<ForgotPasswordValues>({ email: '' });
  const ids = { email: `${id}-email` };
  const success = (
    <>
      <Alert tone="success" title="Check your email">
        {email ? `If an account exists for ${email}, a reset link has been sent.` : 'If an account exists for that email, a reset link has been sent.'} Demo wording: no email is sent.
      </Alert>
      {links.signIn && (
        <p className={styles.secondary}>
          <Link href={links.signIn}>Back to sign in</Link>
        </p>
      )}
    </>
  );
  return (
    <AuthFormShell action={action} hiddenFields={hiddenFields} fieldIds={ids} errors={validateForgotPassword(values)} enhanced={!!onSubmit} onValid={() => onSubmit?.(values)} status={status} serverError={errorMessage} submitLabel="Send reset link" success={success}>
      {(shown) => (
        <>
          <p className={styles.intro}>Enter the email you use for your account and we’ll send you a link to choose a new password.</p>
          <Field id={ids.email} label="Email" required error={shown.email}>
            <Input name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} value={values.email} onChange={(e) => setValues({ email: e.target.value })} />
          </Field>
          {links.signIn && (
            <p className={styles.secondary}>
              Remembered it? <Link href={links.signIn}>Sign in</Link>
            </p>
          )}
        </>
      )}
    </AuthFormShell>
  );
}
