import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import layout from '../../stories/storyLayout.module.css';
import { PromoCodeInput, type PromoApplyResult } from './PromoCodeInput';

const meta = { title: 'Commerce/Cart/PromoCodeInput', component: PromoCodeInput } satisfies Meta<typeof PromoCodeInput>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const noop = () => undefined;

/** Idle, applying, applied (chips with remove) and error. */
export const States: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1.5rem', maxInlineSize: '24rem' }}>
      <div>
        <p className={layout.label}>Idle</p>
        <PromoCodeInput applied={[]} onApply={noop} />
      </div>
      <div>
        <p className={layout.label}>Applying</p>
        <PromoCodeInput applied={[]} onApply={noop} status="applying" />
      </div>
      <div>
        <p className={layout.label}>Applied</p>
        <PromoCodeInput applied={['WELCOME10', 'shipfree']} onApply={noop} onRemove={noop} />
      </div>
      <div>
        <p className={layout.label}>Error</p>
        <PromoCodeInput applied={[]} onApply={noop} status="error" message="“SUMMER99” is not a valid code." />
      </div>
    </div>
  ),
};

const codes: Record<string, string> = { WELCOME10: '10% off your first order' };

function Live() {
  const [applied, setApplied] = useState<string[]>([]);
  const apply = (code: string): PromoApplyResult => {
    const key = code.toUpperCase();
    if (!codes[key]) return { ok: false, message: `“${code}” is not a valid code.` };
    setApplied((a) => [...a, key]);
    return { ok: true, message: `${key} applied: ${codes[key]}.` };
  };
  return (
    <div style={{ maxInlineSize: '24rem' }}>
      <PromoCodeInput applied={applied} onApply={apply} onRemove={(c) => setApplied((a) => a.filter((x) => x !== c))} />
    </div>
  );
}

/** A plain form field named "promo"; success and errors are announced politely. */
export const ApplyAndAnnounce: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Live />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole('textbox', { name: 'Promo code' });
    await expect(input).toHaveAttribute('name', 'promo');
    await expect(input.closest('form')).toHaveAttribute('method', 'post');
    await userEvent.type(input, ' nope ');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('“nope” is not a valid code.'));
    await expect(input).toHaveAccessibleDescription(/“nope” is not a valid code\./);
    await userEvent.clear(input);
    await userEvent.type(input, 'welcome10');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('WELCOME10 applied: 10% off your first order.'));
    await expect(canvas.getByRole('list', { name: 'Applied promo codes' })).toHaveTextContent('WELCOME10');
    await expect(input).toHaveValue('');
    await userEvent.click(canvas.getByRole('button', { name: 'Remove promo code WELCOME10' }));
    await expect(canvas.queryByRole('list', { name: 'Applied promo codes' })).toBeNull();
  },
};
