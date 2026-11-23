/*
 * Small helpers on top of native constraint validation (required, type, pattern, minLength, ...).
 * The browser decides *whether* a field is valid; these functions decide *what to say*.
 * Forms use them with `noValidate`, so the browser's own bubbles never appear.
 */

/** The validity flags that can produce a message (a subset of ValidityState). */
export type ValidityFlag =
  | 'valueMissing'
  | 'typeMismatch'
  | 'patternMismatch'
  | 'tooLong'
  | 'tooShort'
  | 'rangeUnderflow'
  | 'rangeOverflow'
  | 'stepMismatch'
  | 'badInput';

/** Per-flag overrides, e.g. { valueMissing: 'Enter your email address' }. */
export type ValidationMessages = Partial<Record<ValidityFlag, string>>;

/** What the message builder needs to know about a field. Plain data, so it is easy to test. */
export interface FieldContext {
  /** Visible label, used in messages. */
  label: string;
  type?: string;
  minLength?: number;
  maxLength?: number;
  min?: string;
  max?: string;
}

/** Field name → error message. Only invalid fields are present. */
export type FieldErrors = Record<string, string>;

const ORDER: ValidityFlag[] = [
  'valueMissing',
  'badInput',
  'typeMismatch',
  'patternMismatch',
  'tooShort',
  'tooLong',
  'rangeUnderflow',
  'rangeOverflow',
  'stepMismatch',
];

function defaultMessage(flag: ValidityFlag, { label, type, minLength, maxLength, min, max }: FieldContext): string {
  const name = label.toLowerCase();
  switch (flag) {
    case 'valueMissing':
      return type === 'checkbox' ? `Select ${name} to continue` : `Enter ${name}`;
    case 'typeMismatch':
      if (type === 'email') return 'Enter an email address in the correct format, like name@example.com';
      if (type === 'url') return 'Enter a web address in the correct format, like https://example.com';
      return `Enter ${name} in the correct format`;
    case 'patternMismatch':
      return `Enter ${name} in the correct format`;
    case 'tooShort':
      return `${label} must be ${minLength} characters or more`;
    case 'tooLong':
      return `${label} must be ${maxLength} characters or fewer`;
    case 'rangeUnderflow':
      return `${label} must be ${min} or more`;
    case 'rangeOverflow':
      return `${label} must be ${max} or less`;
    case 'stepMismatch':
      return `Enter a valid value for ${name}`;
    case 'badInput':
      return `Enter a valid ${name}`;
  }
}

/**
 * The message for the first failing constraint, or undefined when valid.
 * Pure: takes a ValidityState-like object, so it works with real elements and plain test data.
 */
export function getFieldError(
  validity: Partial<Pick<ValidityState, ValidityFlag | 'valid'>>,
  context: FieldContext,
  messages: ValidationMessages = {},
): string | undefined {
  if (validity.valid) return undefined;
  const flag = ORDER.find((candidate) => validity[candidate]);
  if (!flag) return undefined;
  return messages[flag] ?? defaultMessage(flag, context);
}

type ValidatableElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function isValidatable(element: Element): element is ValidatableElement {
  return element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement;
}

/** Reads constraint info from a live element. */
export function contextFor(element: ValidatableElement, label: string): FieldContext {
  return {
    label,
    type: element.type,
    minLength: 'minLength' in element && element.minLength >= 0 ? element.minLength : undefined,
    maxLength: 'maxLength' in element && element.maxLength >= 0 ? element.maxLength : undefined,
    min: 'min' in element ? element.min : undefined,
    max: 'max' in element ? element.max : undefined,
  };
}

/** Text controls whose values forms trim before use; whitespace in passwords is significant. */
const TRIMMED_TYPES = new Set(['text', 'textarea', 'email', 'search', 'tel', 'url']);

/**
 * True when a required text control holds only whitespace. Native `required` accepts "   ", but forms
 * trim text values, so it would be submitted as empty. Internal (not exported from the package).
 */
export function isBlankRequired({ required, type, value }: { required: boolean; type: string; value: string }): boolean {
  return required && TRIMMED_TYPES.has(type) && value.length > 0 && value.trim() === '';
}

/**
 * Length checks for minLength and maxLength. Native tooShort/tooLong only fire for values the user
 * typed, not for prefilled or programmatic values, so lengths are checked in code. Text controls are
 * measured trimmed, as forms submit them ("a" plus nine spaces is 1 character); other types (such as
 * passwords) are measured as they are, together with the native flags. Empty values are never too
 * short (`required` covers them). Internal (not exported from the package).
 */
export function lengthValidity({
  type,
  value,
  minLength,
  maxLength,
  nativeTooShort = false,
  nativeTooLong = false,
}: {
  type: string;
  value: string;
  minLength?: number;
  maxLength?: number;
  nativeTooShort?: boolean;
  nativeTooLong?: boolean;
}): { tooShort: boolean; tooLong: boolean } {
  const trimmed = TRIMMED_TYPES.has(type);
  const length = trimmed ? value.trim().length : value.length;
  const shortByLength = !!minLength && length > 0 && length < minLength;
  const longByLength = maxLength !== undefined && length > maxLength;
  // The native flags count untrimmed characters, so they only apply to untrimmed types.
  return {
    tooShort: trimmed ? shortByLength : nativeTooShort || shortByLength,
    tooLong: trimmed ? longByLength : nativeTooLong || longByLength,
  };
}

/** Constraint flags for a live element, with the length and whitespace-only checks applied. */
function validityOf(element: ValidatableElement, context: FieldContext): Partial<Pick<ValidityState, ValidityFlag | 'valid'>> {
  const { validity } = element;
  const blank = isBlankRequired(element);
  const lengths = lengthValidity({
    type: element.type,
    value: element.value,
    minLength: context.minLength,
    maxLength: context.maxLength,
    nativeTooShort: validity.tooShort,
    nativeTooLong: validity.tooLong,
  });
  const tooShort = !blank && lengths.tooShort;
  const tooLong = lengths.tooLong;
  return {
    valid: validity.valid && !blank && !tooShort && !tooLong,
    valueMissing: validity.valueMissing || blank,
    typeMismatch: validity.typeMismatch,
    patternMismatch: validity.patternMismatch,
    tooShort,
    tooLong,
    rangeUnderflow: validity.rangeUnderflow,
    rangeOverflow: validity.rangeOverflow,
    stepMismatch: validity.stepMismatch,
    badInput: validity.badInput,
  };
}

/**
 * Validates every named control in a form. Call from a submit handler (the form should have noValidate).
 * `labels` maps field names to their visible labels; `messages` holds per-field overrides.
 * Returns errors in DOM order, which is also the order an error summary should list them.
 */
export function collectFormErrors(
  form: HTMLFormElement,
  labels: Record<string, string>,
  messages: Record<string, ValidationMessages> = {},
): FieldErrors {
  const errors: FieldErrors = {};
  for (const element of Array.from(form.elements)) {
    if (!isValidatable(element) || !element.name || element.disabled || errors[element.name]) continue;
    const context = contextFor(element, labels[element.name] ?? element.name);
    const message = getFieldError(validityOf(element, context), context, messages[element.name]);
    if (message) errors[element.name] = message;
  }
  return errors;
}

/** Validates a single control, e.g. on blur after the first submit. */
export function validateElement(element: Element, label: string, messages?: ValidationMessages): string | undefined {
  if (!isValidatable(element)) return undefined;
  const context = contextFor(element, label);
  return getFieldError(validityOf(element, context), context, messages);
}
