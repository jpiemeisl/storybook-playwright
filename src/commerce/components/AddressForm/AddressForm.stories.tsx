import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, type ReactNode } from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { checkoutAddresses } from '../../fixtures';
import { validateUsAddress } from '../../logic/checkout';
import type { Address } from '../../types/order';
import { AddressForm } from './AddressForm';

const meta = { title: 'Commerce/Checkout/AddressForm', component: AddressForm, tags: ['vrt-mobile'] } satisfies Meta<typeof AddressForm>;
export default meta;
type Story = StoryObj<Record<string, never>>;
const full = { vrt: { viewports: [{ width: 375, fullPage: true }, { width: 1280, fullPage: true }] } };

function Controlled({ section, idPrefix, initial, showErrors }: { section: 'shipping' | 'billing'; idPrefix: string; initial: Partial<Address>; showErrors?: boolean }) {
  const [value, setValue] = useState(initial);
  const errors = showErrors ? validateUsAddress(value, section === 'shipping' ? 'shippingAddress' : 'billingAddress') : undefined;
  return <AddressForm section={section} idPrefix={idPrefix} value={value} errors={errors} onChange={setValue} />;
}

const wrap = (children: ReactNode) => <div style={{ maxInlineSize: '40rem', display: 'grid', gap: '2.5rem' }}>{children}</div>;

/** Empty, filled, with errors and with very long values, one form each. */
export const States: Story = {
  parameters: full,
  render: () =>
    wrap(
      <>
        <Controlled section="shipping" idPrefix="empty" initial={{}} />
        <Controlled section="shipping" idPrefix="filled" initial={checkoutAddresses.apartment} />
        <Controlled section="shipping" idPrefix="errors" initial={{ name: 'Robin Vale', postalCode: '9720', phone: 'call me' }} showErrors />
        <Controlled section="billing" idPrefix="long" initial={checkoutAddresses.longNames} />
      </>,
    ),
};

/** Shipping and billing on one page: unique ids and section-specific autocomplete tokens. */
export const ShippingAndBilling: Story = {
  parameters: full,
  render: () =>
    wrap(
      <>
        <Controlled section="shipping" idPrefix="shipping" initial={checkoutAddresses.home} />
        <Controlled section="billing" idPrefix="billing" initial={checkoutAddresses.zipPlus4} />
      </>,
    ),
  play: async ({ canvasElement }) => {
    const [shipping, billing] = [...canvasElement.querySelectorAll('fieldset')];
    const s = within(shipping as HTMLElement);
    const b = within(billing as HTMLElement);
    await expect(s.getByRole('textbox', { name: 'Full name' })).toHaveAttribute('autocomplete', 'shipping name');
    await expect(s.getByRole('textbox', { name: /^Address/ })).toHaveAttribute('autocomplete', 'shipping address-line1');
    await expect(s.getByRole('combobox', { name: /^State/ })).toHaveAttribute('autocomplete', 'shipping address-level1');
    await expect(b.getByRole('textbox', { name: /^Address/ })).toHaveAttribute('autocomplete', 'billing address-line1');
    await expect(b.getByRole('textbox', { name: /^ZIP code/ })).toHaveAttribute('autocomplete', 'billing postal-code');
    await expect(b.getByRole('textbox', { name: /^ZIP code/ })).toHaveAttribute('inputmode', 'numeric');
    await expect(b.getByRole('textbox', { name: /^Phone/ })).toHaveAttribute('type', 'tel');
    const ids = [...canvasElement.querySelectorAll('[id]')].map((el) => el.id);
    await expect(new Set(ids).size).toBe(ids.length);
    const state = s.getByRole('combobox', { name: /^State/ });
    await expect(state).toHaveValue('OR');
    await expect(within(state).getAllByRole('option')).toHaveLength(52); // placeholder + 50 states + DC
    await userEvent.selectOptions(state, 'WA');
    await expect(state).toHaveValue('WA');
  },
};
