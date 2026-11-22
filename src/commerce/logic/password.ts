/*
 * Baseline password rules for the register and reset forms. A checklist only: no strength scores,
 * entropy claims or breached-password lists. The server must enforce its own rules.
 */

export interface PasswordCheck {
  id: 'length' | 'not-only-digits' | 'letter-and-number' | 'no-edge-spaces';
  label: string;
  passed: boolean;
}

export const MIN_PASSWORD_LENGTH = 12;

/** The checklist, in display order. An empty password passes nothing. */
export function getPasswordChecks(password: string): PasswordCheck[] {
  const filled = password.length > 0;
  return [
    { id: 'length', label: `At least ${MIN_PASSWORD_LENGTH} characters`, passed: [...password].length >= MIN_PASSWORD_LENGTH },
    { id: 'not-only-digits', label: 'Not only numbers', passed: filled && !/^\d+$/.test(password) },
    { id: 'letter-and-number', label: 'Contains a letter and a number', passed: /\p{L}/u.test(password) && /\d/.test(password) },
    { id: 'no-edge-spaces', label: 'No spaces at the start or end', passed: filled && password === password.trim() },
  ];
}

export const isPasswordAcceptable = (password: string) => getPasswordChecks(password).every((c) => c.passed);

/** "3 of 4 password rules met", for a polite announcement. */
export function passwordSummary(password: string): string {
  const checks = getPasswordChecks(password);
  const met = checks.filter((c) => c.passed).length;
  return met === checks.length ? 'All password rules met' : `${met} of ${checks.length} password rules met`;
}
