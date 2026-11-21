import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { checkoutStepLabels } from '../../logic/checkout';
import { Width } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import type { CheckoutStepId } from '../../types/checkout';
import { CheckoutStepper, type CheckoutStepperStep } from './CheckoutStepper';

const meta = { title: 'Commerce/Checkout/CheckoutStepper', component: CheckoutStepper, tags: ['vrt-mobile'] } satisfies Meta<typeof CheckoutStepper>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const four: CheckoutStepId[] = ['information', 'shipping', 'payment', 'review'];
const three: CheckoutStepId[] = ['information', 'payment', 'review'];
const stepsAt = (ids: CheckoutStepId[], current: number): CheckoutStepperStep[] =>
  ids.map((id, i) => ({ id, label: checkoutStepLabels[id], state: i < current ? 'complete' : i === current ? 'current' : 'upcoming', href: `/checkout/${id}` }));

/** Four steps (ships) and three (nothing ships), each step current; then a narrow container. */
export const Matrix: Story = {
  parameters: { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } },
  render: () => (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      {[four, three].flatMap((ids) =>
        ids.map((id, i) => (
          <div key={`${ids.length}-${id}`}>
            <p className={layout.label}>
              {ids.length} steps, current: {checkoutStepLabels[id]}
            </p>
            <CheckoutStepper steps={stepsAt(ids, i)} label={`Checkout steps (${ids.length}, ${id})`} />
          </div>
        )),
      )}
      <Width rem={20}>
        <p className={layout.label}>Narrow container</p>
        <CheckoutStepper steps={stepsAt(four, 2)} label="Checkout steps (narrow)" />
      </Width>
    </div>
  ),
};

function Live({ ids }: { ids: CheckoutStepId[] }) {
  const [current, setCurrent] = useState(ids.length - 1);
  return <CheckoutStepper steps={stepsAt(ids, current)} onSelect={(id) => setCurrent(ids.indexOf(id as CheckoutStepId))} />;
}

/** aria-current="step", three steps without shipping, back links only for completed steps, announcement. */
export const CurrentAndBack: Story = {
  parameters: { vrt: { screenshot: false } },
  render: () => <Live ids={three} />,
  play: async ({ canvasElement }) => {
    const nav = within(canvasElement).getByRole('navigation', { name: 'Checkout steps' });
    const items = within(nav).getAllByRole('listitem');
    await expect(items).toHaveLength(3);
    await expect(items[2]).toHaveAttribute('aria-current', 'step');
    await expect(within(nav).queryByRole('link', { name: /Review/ })).toBeNull();
    await userEvent.click(within(nav).getByRole('link', { name: 'Completed: Information' }));
    await expect(items[0]).toHaveAttribute('aria-current', 'step');
    await expect(within(nav).queryByRole('link', { name: /Payment/ })).toBeNull(); // never forward
    await waitFor(() => expect(within(nav).getByRole('status')).toHaveTextContent('Step 1 of 3: Information'));
  },
};
