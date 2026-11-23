import { describe, expect, it } from 'vitest';
import { getFieldError, isBlankRequired, lengthValidity } from './validation';

describe('isBlankRequired', () => {
  it('treats whitespace-only required text as blank', () => {
    expect(isBlankRequired({ required: true, type: 'text', value: '   ' })).toBe(true);
    expect(isBlankRequired({ required: true, type: 'textarea', value: '\n\t ' })).toBe(true);
    expect(isBlankRequired({ required: true, type: 'email', value: ' ' })).toBe(true);
  });

  it('leaves empty, filled, optional and password values to native validation', () => {
    // Empty is already valueMissing natively.
    expect(isBlankRequired({ required: true, type: 'text', value: '' })).toBe(false);
    expect(isBlankRequired({ required: true, type: 'text', value: '  Ada ' })).toBe(false);
    expect(isBlankRequired({ required: false, type: 'text', value: '   ' })).toBe(false);
    expect(isBlankRequired({ required: true, type: 'password', value: '   ' })).toBe(false);
    expect(isBlankRequired({ required: true, type: 'checkbox', value: ' ' })).toBe(false);
  });

  it('produces the normal required message through getFieldError', () => {
    expect(getFieldError({ valueMissing: true }, { label: 'Full name', type: 'text' })).toBe('Enter full name');
  });
});

describe('lengthValidity', () => {
  it('measures trimmed text against minLength', () => {
    expect(lengthValidity({ type: 'textarea', value: 'a' + ' '.repeat(9), minLength: 10 }).tooShort).toBe(true);
    expect(lengthValidity({ type: 'text', value: '  abcdefghij  ', minLength: 10 }).tooShort).toBe(false);
    expect(lengthValidity({ type: 'textarea', value: 'abcdefghi', minLength: 10 }).tooShort).toBe(true);
  });

  it('measures trimmed text against maxLength', () => {
    expect(lengthValidity({ type: 'text', value: 'abcde   ', maxLength: 5 }).tooLong).toBe(false);
    expect(lengthValidity({ type: 'text', value: 'abcdef', maxLength: 5 }).tooLong).toBe(true);
    // Native flags count the untrimmed value, so they don't override the trimmed check.
    expect(lengthValidity({ type: 'text', value: 'abcde ', maxLength: 5, nativeTooLong: true }).tooLong).toBe(false);
  });

  it('leaves empty and whitespace-only values to required', () => {
    expect(lengthValidity({ type: 'text', value: '', minLength: 3 }).tooShort).toBe(false);
    expect(lengthValidity({ type: 'text', value: '   ', minLength: 10 }).tooShort).toBe(false);
  });

  it('keeps passwords untrimmed and honors native flags', () => {
    expect(lengthValidity({ type: 'password', value: 'a' + ' '.repeat(9), minLength: 10 }).tooShort).toBe(false);
    expect(lengthValidity({ type: 'password', value: 'abcdefgh  ', maxLength: 8 }).tooLong).toBe(true);
    expect(lengthValidity({ type: 'password', value: 'abcdefghij', minLength: 8, nativeTooShort: true }).tooShort).toBe(true);
  });
});
