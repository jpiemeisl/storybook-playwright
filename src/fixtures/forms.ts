/*
 * Form fixtures for stories and visual tests (Brightside Bookkeeping, the fictional firm from Phase 4).
 */
import type { ContactFormValues } from '../components/ContactForm';
import type { SelectOption, SelectOptionGroup } from '../components/Select';

export const subjectOptions: SelectOption[] = [
  { value: 'new-client', label: 'Becoming a new client' },
  { value: 'existing', label: 'Question about my account' },
  { value: 'billing', label: 'Billing and invoices' },
  { value: 'payroll', label: 'Payroll' },
  { value: 'other', label: 'Something else' },
];

export const longSubjectLabel =
  'Request for a historical clean-up of more than three financial years of unreconciled accounts across multiple entities';

/** Twelve options, one with a very long label, and one disabled. */
export const subjectOptionsTwelve: SelectOption[] = [
  ...subjectOptions,
  { value: 'tax', label: 'Tax filing' },
  { value: 'sales-tax', label: 'Sales tax' },
  { value: 'cleanup', label: longSubjectLabel },
  { value: 'software', label: 'Accounting software migration' },
  { value: 'audit', label: 'Audit support' },
  { value: 'partnership', label: 'Partnerships', disabled: true },
  { value: 'press', label: 'Press enquiry' },
];

export const groupedOptions: SelectOptionGroup[] = [
  { label: 'Services', options: [{ value: 'books', label: 'Monthly bookkeeping' }, { value: 'payroll', label: 'Payroll' }, { value: 'tax', label: 'Tax filing' }] },
  { label: 'Support', options: [{ value: 'billing', label: 'Billing' }, { value: 'access', label: 'Account access' }, { value: 'legacy', label: 'Legacy plan (no longer offered)', disabled: true }] },
];

export const filledContact: ContactFormValues = {
  name: 'Priya Natarajan',
  email: 'priya@copperleaf.example',
  phone: '+1 (555) 014-2290',
  subject: 'payroll',
  message: 'Hi! We are adding six seasonal staff in April. Can you set up payroll for them from the first pay run, and what would that cost on the Essentials plan?',
};

export const longName = 'Alexandra Montgomery-Fairweather-Okonkwo-Vanderbilt de la Cruz';
export const longEmail = 'alexandra.montgomery-fairweather.accounts-payable-department@northwind-outfitters-expedition-supply.example';

const sentence = 'We run three retail locations and an online store, and our books have fallen behind since the spring. ';
/** Exactly 2,000 characters. */
export const message2000 = sentence.repeat(Math.ceil(2000 / sentence.length)).slice(0, 2000);

export const longValuesContact: ContactFormValues = {
  name: longName,
  email: longEmail,
  phone: '+1 (555) 014-2290 ext. 4471',
  subject: 'cleanup',
  message: message2000,
};

/** Every field fails a different constraint: missing, type mismatch, too short. */
export const invalidContact: Partial<ContactFormValues> = {
  name: '',
  email: 'priya-at-copperleaf',
  phone: '',
  subject: '',
  message: 'Hi',
};

export const serverErrorMessage = 'Our servers had a problem sending your message. Nothing was lost: please try again in a few minutes.';
export const successMessage = 'Thanks, Priya. Your message is with Ana Ruiz, who will reply by the end of the next working day.';
export const consentLabel = 'I agree to Brightside storing my details to reply to this message.';
export const newsletterConsentLabel = 'Send me the monthly tips email. Unsubscribe at any time.';
