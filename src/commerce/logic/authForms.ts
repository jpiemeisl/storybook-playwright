/*
 * Validation for the sign-in, register and password forms. Pure; messages come from the shared
 * getFieldError helper. These are client-side checks only: the server validates again.
 *
 * Non-enumerating errors: these validators only check the shape of what was typed. Whether an account
 * exists is the server's business, and the forms show the same generic message either way
 * (see GENERIC_LOGIN_ERROR and the forgot-password success text).
 */
import { getFieldError } from '../../utils/validation';
import { isPasswordAcceptable } from './password';
import { EMAIL } from './validate';

/** Field errors from the auth form validators, keyed by field name; fields without errors are omitted. */
export type AuthErrors = Partial<Record<string, string>>;

/** Values submitted by the sign-in form. */
export interface LoginValues {
  email: string;
  password: string;
  remember?: boolean;
}
/** Values submitted by the create-account form. */
export interface RegisterValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  marketingConsent?: boolean;
  termsAccepted: boolean;
}
/** Values submitted by the forgot-password form. */
export interface ForgotPasswordValues {
  email: string;
}
/** Values submitted by the reset-password form. */
export interface ResetPasswordValues {
  password: string;
  confirmPassword: string;
}

/** Shown for any failed sign-in, whatever the reason: it never says whether the email has an account. */
export const GENERIC_LOGIN_ERROR = 'The email or password is incorrect. Check them and try again, or reset your password.';

function email(value: string): string | undefined {
  const v = value.trim();
  if (!v) return getFieldError({ valueMissing: true }, { label: 'Email' }, { valueMissing: 'Enter your email address' });
  if (!EMAIL.test(v)) return getFieldError({ typeMismatch: true }, { label: 'Email', type: 'email' });
  return undefined;
}

function newPassword(password: string, confirm: string, errors: AuthErrors) {
  if (!password) errors.password = getFieldError({ valueMissing: true }, { label: 'Password' }, { valueMissing: 'Enter a password' });
  else if (!isPasswordAcceptable(password)) errors.password = 'Choose a password that meets every rule in the list';
  if (!confirm) errors.confirmPassword = getFieldError({ valueMissing: true }, { label: 'Confirm password' }, { valueMissing: 'Enter the password again' });
  else if (confirm !== password) errors.confirmPassword = 'The passwords do not match';
}

const clean = (errors: AuthErrors): AuthErrors => Object.fromEntries(Object.entries(errors).filter(([, v]) => v));

/** Validates the sign-in form: a well-formed email and a non-empty password. Returns field errors (empty when valid); pure, and never reveals whether an account exists. */
export function validateLogin(values: LoginValues): AuthErrors {
  return clean({ email: email(values.email), password: values.password ? undefined : getFieldError({ valueMissing: true }, { label: 'Password' }, { valueMissing: 'Enter your password' }) });
}

/** Validates the create-account form: name, email, a password that meets every checklist rule, a matching confirmation and accepted terms. Returns field errors (empty when valid); pure. */
export function validateRegister(values: RegisterValues): AuthErrors {
  const errors: AuthErrors = {};
  if (!values.name.trim()) errors.name = getFieldError({ valueMissing: true }, { label: 'Name' }, { valueMissing: 'Enter your name' });
  errors.email = email(values.email);
  newPassword(values.password, values.confirmPassword, errors);
  if (!values.termsAccepted) errors.termsAccepted = getFieldError({ valueMissing: true }, { label: 'Terms', type: 'checkbox' }, { valueMissing: 'Accept the terms to create an account' });
  return clean(errors);
}

/** Validates the forgot-password form (a well-formed email). Returns field errors (empty when valid); pure. */
export const validateForgotPassword = (values: ForgotPasswordValues): AuthErrors => clean({ email: email(values.email) });

/** Validates the reset-password form: a password that meets every checklist rule and a matching confirmation. Returns field errors (empty when valid); pure. */
export function validateResetPassword(values: ResetPasswordValues): AuthErrors {
  const errors: AuthErrors = {};
  newPassword(values.password, values.confirmPassword, errors);
  return clean(errors);
}
