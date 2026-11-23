import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Checkbox } from '../../../components/Checkbox';
import { Field } from '../../../components/Field';
import { Input } from '../../../components/Input';
import { Link } from '../../../components/Link';
import { validateRegister, type RegisterValues } from '../../logic/authForms';
import { getPasswordChecks, passwordSummary } from '../../logic/password';
import { AuthFormShell, PasswordChecklist, PasswordField, type AuthFormBaseProps } from '../AuthForm';
import styles from '../AuthForm/AuthForm.module.css';

/** Props for RegisterForm, the create-account form. */
export interface RegisterFormProps extends AuthFormBaseProps<RegisterValues> {
  /** Sign-in, terms and privacy links. */
  links?: { signIn?: string; terms?: string; privacy?: string };
  /** Shown instead of the form when status is `success`. */
  successMessage?: ReactNode;
}

/**
 * Hook for the password checklist announcement, without timers: a summary is announced when the
 * password field loses focus, and once when every rule becomes met while typing. Individual
 * keystrokes are never announced.
 */
export function usePasswordAnnouncement(password: string) {
  const [announcement, setAnnouncement] = useState('');
  const allMet = getPasswordChecks(password).every((c) => c.passed);
  const wasAllMet = useRef(allMet);
  useEffect(() => {
    if (allMet && !wasAllMet.current) setAnnouncement('All password rules met');
    wasAllMet.current = allMet;
  }, [allMet]);
  return { announcement, onBlur: () => password && setAnnouncement(passwordSummary(password)) };
}

/**
 * Create-account form: name ("name"), email ("email"), password ("new-password") with the live
 * checklist, confirm password, optional marketing consent and required terms. A real POST form with
 * fields name, email, password, confirmPassword, marketingConsent and termsAccepted.
 */
export function RegisterForm({ action = '', hiddenFields, onSubmit, status = 'idle', errorMessage = 'We couldn’t create your account. Try again in a few minutes.', links = {}, successMessage }: RegisterFormProps) {
  const id = useId();
  const [values, setValues] = useState<RegisterValues>({ name: '', email: '', password: '', confirmPassword: '', marketingConsent: false, termsAccepted: false });
  const errors = validateRegister(values);
  const set = (patch: Partial<RegisterValues>) => setValues((v) => ({ ...v, ...patch }));
  const ids = { name: `${id}-name`, email: `${id}-email`, password: `${id}-password`, confirmPassword: `${id}-confirm`, termsAccepted: `${id}-terms` };
  const checklistId = `${id}-rules`;
  const { announcement, onBlur } = usePasswordAnnouncement(values.password);

  return (
    <AuthFormShell
      action={action}
      hiddenFields={hiddenFields}
      fieldIds={ids}
      errors={errors}
      enhanced={!!onSubmit}
      onValid={() => onSubmit?.(values)}
      status={status}
      serverError={errorMessage}
      submitLabel="Create account"
      success={successMessage}
    >
      {(shown) => (
        <>
          <Field id={ids.name} label="Name" required error={shown.name}>
            <Input name="name" autoComplete="name" value={values.name} onChange={(e) => set({ name: e.target.value })} />
          </Field>
          <Field id={ids.email} label="Email" required error={shown.email} hint="For your receipts and order updates.">
            <Input name="email" type="email" autoComplete="email" inputMode="email" spellCheck={false} value={values.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <PasswordField id={ids.password} name="password" label="Password" autoComplete="new-password" value={values.password} onChange={(password) => set({ password })} onBlur={onBlur} error={shown.password} describedBy={checklistId} />
          <PasswordChecklist id={checklistId} checks={getPasswordChecks(values.password)} announcement={announcement} />
          <PasswordField id={ids.confirmPassword} name="confirmPassword" label="Confirm password" autoComplete="new-password" value={values.confirmPassword} onChange={(confirmPassword) => set({ confirmPassword })} error={shown.confirmPassword} />
          <Checkbox id={`${id}-marketing`} name="marketingConsent" value="1" label="Email me about new products and offers (optional)" checked={!!values.marketingConsent} onChange={(e) => set({ marketingConsent: e.target.checked })} />
          <Checkbox
            id={ids.termsAccepted}
            name="termsAccepted"
            value="1"
            required
            error={shown.termsAccepted}
            checked={values.termsAccepted}
            onChange={(e) => set({ termsAccepted: e.target.checked })}
            label={
              <>
                I agree to the <Link href={links.terms ?? '/terms'}>terms</Link> and <Link href={links.privacy ?? '/privacy'}>privacy policy</Link>
              </>
            }
          />
          {links.signIn && (
            <p className={styles.secondary}>
              Already have an account? <Link href={links.signIn}>Sign in</Link>
            </p>
          )}
        </>
      )}
    </AuthFormShell>
  );
}
