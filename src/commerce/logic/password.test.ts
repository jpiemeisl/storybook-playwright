import { describe, expect, it } from 'vitest';
import { GENERIC_LOGIN_ERROR, validateForgotPassword, validateLogin, validateRegister, validateResetPassword } from './authForms';
import { getPasswordChecks, isPasswordAcceptable, passwordSummary } from './password';

const passed = (password: string) => getPasswordChecks(password).filter((c) => c.passed).map((c) => c.id);

describe('password checks', () => {
  it('lists every rule with pass or fail', () => {
    expect(getPasswordChecks('').every((c) => !c.passed)).toBe(true);
    expect(passed('123456789012')).toEqual(['length', 'no-edge-spaces']);
    expect(passed('short1')).toEqual(['not-only-digits', 'letter-and-number', 'no-edge-spaces']);
    expect(passed(' trailing space 1 ')).toEqual(['length', 'not-only-digits', 'letter-and-number']);
    expect(passed('compost-heap-7')).toEqual(['length', 'not-only-digits', 'letter-and-number', 'no-edge-spaces']);
  });

  it('counts characters, not UTF-16 units, and accepts any letters', () => {
    expect(passed('ñandú-jardín-9')).toContain('letter-and-number');
    expect(getPasswordChecks('🌱🌱🌱🌱🌱🌱')[0]!.passed).toBe(false); // 6 characters, though 12 UTF-16 units
    expect(getPasswordChecks('🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱🌱a')[0]!.passed).toBe(true); // 12 characters
  });

  it('acceptable only when every rule passes; summary for announcements', () => {
    expect(isPasswordAcceptable('compost-heap-7')).toBe(true);
    expect(isPasswordAcceptable('compost-heap')).toBe(false);
    expect(passwordSummary('compost')).toBe('2 of 4 password rules met');
    expect(passwordSummary('compost-heap-7')).toBe('All password rules met');
  });
});

describe('auth form validation', () => {
  it('login: email format and a password, nothing about whether the account exists', () => {
    expect(validateLogin({ email: '', password: '' })).toEqual({ email: 'Enter your email address', password: 'Enter your password' });
    expect(validateLogin({ email: 'robin@', password: 'x' })).toEqual({ email: 'Enter an email address in the correct format, like name@example.com' });
    expect(validateLogin({ email: 'robin@example.com', password: 'x' })).toEqual({});
    expect(GENERIC_LOGIN_ERROR).not.toMatch(/not found|no account|exists/i);
  });

  it('register: name, email, password rules, confirm match, terms', () => {
    expect(validateRegister({ name: '', email: '', password: '', confirmPassword: '', termsAccepted: false })).toEqual({
      name: 'Enter your name',
      email: 'Enter your email address',
      password: 'Enter a password',
      confirmPassword: 'Enter the password again',
      termsAccepted: 'Accept the terms to create an account',
    });
    expect(validateRegister({ name: 'Robin', email: 'robin@example.com', password: 'compost', confirmPassword: 'compost', termsAccepted: true })).toEqual({ password: 'Choose a password that meets every rule in the list' });
    expect(validateRegister({ name: 'Robin', email: 'robin@example.com', password: 'compost-heap-7', confirmPassword: 'compost-heap-8', termsAccepted: true })).toEqual({ confirmPassword: 'The passwords do not match' });
    expect(validateRegister({ name: 'Robin', email: 'robin@example.com', password: 'compost-heap-7', confirmPassword: 'compost-heap-7', termsAccepted: true })).toEqual({});
  });

  it('forgot and reset password', () => {
    expect(validateForgotPassword({ email: 'nope' })).toEqual({ email: 'Enter an email address in the correct format, like name@example.com' });
    expect(validateForgotPassword({ email: 'robin@example.com' })).toEqual({});
    expect(validateResetPassword({ password: 'compost-heap-7', confirmPassword: '' })).toEqual({ confirmPassword: 'Enter the password again' });
    expect(validateResetPassword({ password: 'compost-heap-7', confirmPassword: 'compost-heap-7' })).toEqual({});
  });
});
