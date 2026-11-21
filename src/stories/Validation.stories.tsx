import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { getFieldError, type FieldContext } from '../utils/validation';
import styles from './FormatMoney.module.css';

/*
 * Unit-style checks for the validation helpers, run by the play function (and so by test:vrt).
 * getFieldError is pure, so plain objects stand in for ValidityState.
 */
const email: FieldContext = { label: 'Email address', type: 'email' };
const message: FieldContext = { label: 'Message', type: 'textarea', minLength: 10, maxLength: 2000 };
const consent: FieldContext = { label: 'Terms', type: 'checkbox' };
const age: FieldContext = { label: 'Age', type: 'number', min: '18', max: '120' };

const cases: { note: string; actual: string | undefined; expected: string | undefined }[] = [
  { note: 'valid', actual: getFieldError({ valid: true }, email), expected: undefined },
  { note: 'missing', actual: getFieldError({ valueMissing: true }, email), expected: 'Enter email address' },
  { note: 'missing with override', actual: getFieldError({ valueMissing: true }, email, { valueMissing: 'Enter your email address' }), expected: 'Enter your email address' },
  { note: 'email format', actual: getFieldError({ typeMismatch: true }, email), expected: 'Enter an email address in the correct format, like name@example.com' },
  { note: 'too short', actual: getFieldError({ tooShort: true }, message), expected: 'Message must be 10 characters or more' },
  { note: 'too long', actual: getFieldError({ tooLong: true }, message), expected: 'Message must be 2000 characters or fewer' },
  { note: 'checkbox missing', actual: getFieldError({ valueMissing: true }, consent), expected: 'Select terms to continue' },
  { note: 'below min', actual: getFieldError({ rangeUnderflow: true }, age), expected: 'Age must be 18 or more' },
  { note: 'missing wins over others', actual: getFieldError({ valueMissing: true, typeMismatch: true }, email), expected: 'Enter email address' },
];

function ValidationTable() {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>getFieldError(validity, context, overrides)</caption>
      <thead>
        <tr>
          <th scope="col">Case</th>
          <th scope="col">Message</th>
        </tr>
      </thead>
      <tbody>
        {cases.map(({ note, actual }) => (
          <tr key={note}>
            <td>{note}</td>
            <td>{actual ?? '(valid)'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta = {
  title: 'Utilities/validation',
  component: ValidationTable,
} satisfies Meta<typeof ValidationTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checks: Story = {
  play: async () => {
    for (const { note, actual, expected } of cases) {
      await expect(actual, note).toBe(expected);
    }
  },
};
