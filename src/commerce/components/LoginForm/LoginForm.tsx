import { useId, useState, type ReactNode } from 'react';
import { Checkbox } from '../../../components/Checkbox';
import { Field } from '../../../components/Field';
import { Input } from '../../../components/Input';
import { Link } from '../../../components/Link';
import { GENERIC_LOGIN_ERROR, validateLogin, type LoginValues } from '../../logic/authForms';
import { AuthFormShell, PasswordField, type AuthFormBaseProps } from '../AuthForm';
import styles from '../AuthForm/AuthForm.module.css';

/** Props for LoginForm, the sign-in form. */
export interface LoginFormProps extends AuthFormBaseProps<LoginValues> {
  /** "Forgot your password?" and "Create an account" links. */
  links?: { forgotPassword?: string; register?: string };
  /** Optional sign-in buttons from the host (nothing by default). */
  socialSlot?: ReactNode;
}

/**
 * Sign-in form: email (autocomplete "username"), password (autocomplete "current-password") with a
 * show/hide toggle, "Remember me", and links. A real POST form with fields email, password and
 * remember. Server errors default to GENERIC_LOGIN_ERROR, which never says whether the account exists.
 */
export function LoginForm({ action = '', hiddenFields, onSubmit, status = 'idle', errorMessage = GENERIC_LOGIN_ERROR, links = {}, socialSlot }: LoginFormProps) {
  const id = useId();
  const [values, setValues] = useState<LoginValues>({
    email: '',
    password: '',
    remember: false,
  });
  const errors = validateLogin(values);
  const ids = { email: `${id}-email`, password: `${id}-password` };
  const set = (patch: Partial<LoginValues>) => setValues((v) => ({ ...v, ...patch }));

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
      submitLabel="Sign in"
    >
      {(shown) => (
        <>
          {socialSlot}
          <Field id={ids.email} label="Email" required error={shown.email}>
            <Input name="email" type="email" autoComplete="username" inputMode="email" spellCheck={false} value={values.email} onChange={(e) => set({ email: e.target.value })} />
          </Field>
          <PasswordField id={ids.password} name="password" label="Password" autoComplete="current-password" value={values.password} onChange={(password) => set({ password })} error={shown.password} />
          <div className={styles.row}>
            <Checkbox id={`${id}-remember`} name="remember" value="1" label="Remember me" checked={!!values.remember} onChange={(e) => set({ remember: e.target.checked })} />
            {links.forgotPassword && <Link href={links.forgotPassword}>Forgot your password?</Link>}
          </div>
          {links.register && (
            <p className={styles.secondary}>
              New here? <Link href={links.register}>Create an account</Link>
            </p>
          )}
        </>
      )}
    </AuthFormShell>
  );
}
