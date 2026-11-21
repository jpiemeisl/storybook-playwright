import { describe, expect, it } from 'vitest';
import { computeCartTotals } from '../../src/commerce';
import { carts, checkoutValues, demoCartContext } from '../../src/commerce/fixtures';
import { validateOrder } from '../../src/commerce/logic/validate';
import { checkoutReducer, DEMO_DECLINED, initialCheckoutState } from './checkoutReducer';

const flags = (cart: keyof typeof carts) => computeCartTotals(carts[cart], demoCartContext).flags;

describe('demo checkout reducer', () => {
  it('places an order with deterministic ids and stores it as lastOrder', () => {
    const state = checkoutReducer(initialCheckoutState(checkoutValues.mixed), { type: 'placeOrder', cart: carts.mixed, flags: flags('mixed'), fail: false });
    expect(state.lastOrder).toMatchObject({ id: 'ord-2026-2101', number: 'FH-2101', placedAt: '2026-03-21T09:00:00Z' });
    expect(validateOrder(state.lastOrder)).toEqual([]);
    const second = checkoutReducer(state, { type: 'placeOrder', cart: carts.mixed, flags: flags('mixed'), fail: false });
    expect(second.lastOrder?.number).toBe('FH-2102');
  });

  it('fails only when the story flag says so', () => {
    const state = checkoutReducer(initialCheckoutState(checkoutValues.physical), { type: 'placeOrder', cart: carts.physicalOnly, flags: flags('physicalOnly'), fail: true });
    expect(state).toMatchObject({ status: 'error', errorMessage: DEMO_DECLINED, lastOrder: null });
    expect(checkoutReducer(state, { type: 'change', values: checkoutValues.physical }).status).toBe('idle');
  });

  it('validation blocks placing and sends the customer to the first invalid step with its errors', () => {
    const state = checkoutReducer(initialCheckoutState(checkoutValues.invalidShipping), { type: 'placeOrder', cart: carts.physicalOnly, flags: flags('physicalOnly'), fail: false });
    expect(state.step).toBe('shipping');
    expect(state.errors).toEqual({ shippingMethodId: 'Choose a shipping method' });
    expect(state.lastOrder).toBeNull();
  });

  it('goTo refuses steps past an invalid one and steps the cart does not have', () => {
    const start = initialCheckoutState();
    expect(checkoutReducer(start, { type: 'goTo', step: 'payment', flags: flags('physicalOnly') })).toBe(start);
    const digital = initialCheckoutState(checkoutValues.digital);
    expect(checkoutReducer(digital, { type: 'goTo', step: 'payment', flags: flags('digitalOnly') }).step).toBe('payment');
    expect(checkoutReducer(digital, { type: 'goTo', step: 'shipping', flags: flags('digitalOnly') })).toBe(digital);
  });
});
