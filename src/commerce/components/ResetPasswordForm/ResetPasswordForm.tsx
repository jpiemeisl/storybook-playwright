import { useId, useState } from 'react';
import { Alert } from '../../../components/Alert';
import { ButtonLink } from '../../../components/Button';
import { Link } from '../../../components/Link';
import { validateResetPassword, type ResetPasswordValues } from '../../logic/authForms';
import { getPasswordChecks } from '../../logic/password';
import { AuthFormShell, PasswordChecklist, PasswordField, type AuthFormBaseProps } from '../AuthForm';
import { usePasswordAnnouncement } from '../RegisterForm/RegisterForm';
import styles from '../AuthForm/AuthForm.module.css';

/** Props for ResetPasswordForm, the choose-a-new-password form reached from a reset link. */
export interface ResetPasswordFormProps extends AuthFormBaseProps<ResetPasswordValues> {
  /** The reset link has expired: show how to request a new one instead of the form. */
  expired?: boolean;
  links?: { signIn?: string; forgotPassword?: string };
}

/**
 * Choose a new password: password and confirm ("new-password") with the checklist. Success links to
 * sign in; an expired link shows an Alert with a link to request a new one. Fields password and
 * confirmPassword; the reset token belongs in `hiddenFields`.
 */
export function ResetPasswordForm({ action = '', hiddenFields, onSubmit, status = 'idle', errorMessage = 'We couldn’t change your password. Request a new link and try again.', expired = false, links = {} }: ResetPasswordFormProps) {
  const id = useId();
  const [values, setValues] = useState<ResetPasswordValues>({ password: '', confirmPassword: '' });
  const ids = { password: `${id}-password`, confirmPassword: `${id}-confirm` };
  const checklistId = `${id}-rules`;
  const { announcement, onBlur } = usePasswordAnnouncement(values.password);

  if (expired) {
    return (
      <div className={styles.form}>
        <Alert tone="warning" title="This link has expired">
          Reset links work for a limited time. Request a new one and use it straight away.
        </Alert>
        <ButtonLink href={links.forgotPassword ?? '/account/forgot-password'}>Request a new link</ButtonLink>
      </div>
    );
  }

  const success = (
    <>
      <Alert tone="success" title="Password changed">
        You can now sign in with your new password.
      </Alert>
      <ButtonLink href={links.signIn ?? '/account/login'}>Sign in</ButtonLink>
    </>
  );

  return (
    <AuthFormShell action={action} hiddenFields={hiddenFields} fieldIds={ids} errors={validateResetPassword(values)} enhanced={!!onSubmit} onValid={() => onSubmit?.(values)} status={status} serverError={errorMessage} submitLabel="Change password" success={success}>
      {(shown) => (
        <>
          <PasswordField id={ids.password} name="password" label="New password" autoComplete="new-password" value={values.password} onChange={(password) => setValues((v) => ({ ...v, password }))} onBlur={onBlur} error={shown.password} describedBy={checklistId} />
          <PasswordChecklist id={checklistId} checks={getPasswordChecks(values.password)} announcement={announcement} />
          <PasswordField id={ids.confirmPassword} name="confirmPassword" label="Confirm new password" autoComplete="new-password" value={values.confirmPassword} onChange={(confirmPassword) => setValues((v) => ({ ...v, confirmPassword }))} error={shown.confirmPassword} />
          {links.signIn && (
            <p className={styles.secondary}>
              <Link href={links.signIn}>Back to sign in</Link>
            </p>
          )}
        </>
      )}
    </AuthFormShell>
  );
}
