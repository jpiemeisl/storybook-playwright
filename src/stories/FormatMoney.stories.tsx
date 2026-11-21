import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import type { Money } from '../content-types/money';
import { formatMoney, type FormatMoneyOptions } from '../utils/formatMoney';
import styles from './FormatMoney.module.css';

/*
 * Unit-style checks for formatMoney, run by the play function (and therefore by `npm run test:vrt`).
 * No test runner needed.
 */
const cases: { value: Money; options?: FormatMoneyOptions; expected: string; note: string }[] = [
  { value: { amount: 1999, currency: 'USD' }, expected: '$19.99', note: 'cents' },
  { value: { amount: 0, currency: 'USD' }, expected: '$0.00', note: 'zero' },
  { value: { amount: 1249900, currency: 'USD' }, expected: '$12,499.00', note: 'grouping' },
  { value: { amount: 1249900, currency: 'USD' }, options: { trimWholeAmounts: true }, expected: '$12,499', note: 'trimmed whole amount' },
  { value: { amount: 4950, currency: 'USD' }, options: { trimWholeAmounts: true }, expected: '$49.50', note: 'not trimmed when cents present' },
  { value: { amount: 1500, currency: 'JPY' }, expected: '¥1,500', note: 'zero-decimal currency' },
  { value: { amount: 1050, currency: 'EUR' }, expected: '€10.50', note: 'other 2-decimal currency' },
  { value: { amount: 1234, currency: 'KWD' }, expected: 'KWD 1.234', note: '3-decimal currency' },
  { value: { amount: -2500, currency: 'USD' }, expected: '-$25.00', note: 'negative (refunds)' },
];

/* Intl uses non-breaking spaces; compare with normal spaces. */
const normalise = (text: string) => text.replace(/\s/g, ' ');

function FormatMoneyTable() {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>formatMoney(value, options) in en-US</caption>
      <thead>
        <tr>
          <th scope="col">Input (minor units)</th>
          <th scope="col">Options</th>
          <th scope="col">Output</th>
          <th scope="col">Case</th>
        </tr>
      </thead>
      <tbody>
        {cases.map(({ value, options, note }) => (
          <tr key={note}>
            <td>
              {value.amount} {value.currency}
            </td>
            <td>{options ? JSON.stringify(options) : '-'}</td>
            <td data-testid="output">{formatMoney(value, options)}</td>
            <td>{note}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const meta = {
  title: 'Utilities/formatMoney',
  component: FormatMoneyTable,
} satisfies Meta<typeof FormatMoneyTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Checks: Story = {
  play: async () => {
    for (const { value, options, expected, note } of cases) {
      await expect(normalise(formatMoney(value, options)), note).toBe(normalise(expected));
    }
  },
};
