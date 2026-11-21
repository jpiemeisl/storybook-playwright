import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import layout from '../../stories/storyLayout.module.css';
import type { CheckoutValues } from '../../types/checkout';
import { DemoPaymentFields, PaymentMethodSelector } from './PaymentMethodSelector';

const meta = { title: 'Commerce/Checkout/PaymentMethodSelector', component: PaymentMethodSelector } satisfies Meta<typeof PaymentMethodSelector>;
export default meta;
type Story = StoryObj<Record<string, never>>;

function Live({ initial }: { initial?: CheckoutValues['paymentMethod'] }) {
  const [value, setValue] = useState(initial);
  return <PaymentMethodSelector value={value} onChange={setValue} paymentFields={<DemoPaymentFields />} name={`payment-${initial ?? 'none'}`} />;
}

/** Card selected and wallet selected, each with the demo payment-fields panel; and nothing chosen with an error. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '2rem', maxInlineSize: '32rem' }}>
      <div>
        <p className={layout.label}>Card</p>
        <Live initial="card" />
      </div>
      <div>
        <p className={layout.label}>Wallet</p>
        <Live initial="wallet" />
      </div>
      <div>
        <p className={layout.label}>Nothing chosen (error)</p>
        <PaymentMethodSelector onChange={() => undefined} error="Choose a payment method" name="payment-error" />
      </div>
    </div>
  ),
};

/** Security rule: the selector and the demo panel contain no text inputs at all. */
export const NoCardInputs: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Live />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('radio', { name: 'Credit or debit card' }));
    await expect(canvas.getByRole('region', { name: 'Credit or debit card details' })).toHaveTextContent('Demo only: no payment is taken.');
    await expect(canvas.queryAllByRole('textbox')).toHaveLength(0);
    await expect(canvasElement.querySelectorAll('input:not([type="radio"]), textarea, select, iframe')).toHaveLength(0);
  },
};
