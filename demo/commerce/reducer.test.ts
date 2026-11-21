import { describe, expect, it } from 'vitest';
import { carts, coffee, mug, plannerApp, promoDefinitions, tee } from '../../src/commerce/fixtures';
import { createDemoReducer, initialDemoState, type DemoAction, type DemoState } from './reducer';

const reducer = createDemoReducer(promoDefinitions);
const run = (actions: DemoAction[], start: DemoState = initialDemoState(carts.empty)) => actions.reduce(reducer, start);
const monthly = coffee.purchaseOptions[2]!;

describe('demo reducer', () => {
  it('adds lines with deterministic ids and merges identical lines', () => {
    const state = run([
      { type: 'addLine', product: mug, variantId: 'mug-default' },
      { type: 'addLine', product: tee, variantId: 'tee-m-moss', quantity: 2 },
      { type: 'addLine', product: mug, variantId: 'mug-default', quantity: 3 },
    ]);
    expect(state.cart.lines.map((l) => [l.id, l.variantId, l.quantity])).toEqual([['line-1', 'mug-default', 4], ['line-2', 'tee-m-moss', 2]]);
    expect(state.lastAction).toEqual({ type: 'addLine', ok: true, message: 'Stoneware mug quantity is now 4.' });
    expect(state.log).toHaveLength(3);
  });

  it('keeps different purchase options as separate lines, and merges when an option change makes them equal', () => {
    let state = run([
      { type: 'addLine', product: coffee, variantId: 'coffee-250' },
      { type: 'addLine', product: coffee, variantId: 'coffee-250', purchaseOption: monthly },
    ]);
    expect(state.cart.lines).toHaveLength(2);
    state = reducer(state, { type: 'setPurchaseOption', lineId: 'line-1', purchaseOption: monthly });
    expect(state.cart.lines.map((l) => [l.id, l.quantity])).toEqual([['line-2', 2]]);
  });

  it('refuses a one-time option for a subscription product', () => {
    const state = run([{ type: 'addLine', product: plannerApp, variantId: 'planner-default' }, { type: 'setPurchaseOption', lineId: 'line-1', purchaseOption: { type: 'one-time' } }]);
    expect(state.lastAction?.ok).toBe(false);
    expect(state.cart.lines[0]!.purchaseOption.type).toBe('subscription');
  });

  it('limits quantities: 0 removes, at most 99, adds cap at 99', () => {
    const start = run([{ type: 'addLine', product: mug, variantId: 'mug-default' }]);
    expect(reducer(start, { type: 'setQuantity', lineId: 'line-1', quantity: 150 }).cart.lines[0]!.quantity).toBe(99);
    expect(reducer(start, { type: 'setQuantity', lineId: 'line-1', quantity: 0 }).cart.lines).toEqual([]);
    expect(reducer(start, { type: 'setQuantity', lineId: 'line-1', quantity: -3 }).cart.lines).toEqual([]);
    expect(run([{ type: 'addLine', product: mug, variantId: 'mug-default', quantity: 98 }], start).cart.lines[0]!.quantity).toBe(99);
    expect(run([{ type: 'addLine', product: mug, variantId: 'mug-default', quantity: 0 }]).lastAction?.ok).toBe(false);
  });

  it('applies promo codes case-insensitively, ignores duplicates and reports unknown codes', () => {
    const state = run([
      { type: 'applyPromo', code: 'welcome10' },
      { type: 'applyPromo', code: 'WELCOME10' },
      { type: 'applyPromo', code: 'BOGUS' },
      { type: 'applyPromo', code: ' shipfree ' },
    ]);
    expect(state.cart.promoCodes).toEqual(['WELCOME10', 'SHIPFREE']);
    expect(state.log).toEqual([
      'applyPromo: WELCOME10 applied: 10% off your first order.',
      'applyPromo: WELCOME10 is already applied.',
      'applyPromo: "BOGUS" is not a valid code.',
      'applyPromo: SHIPFREE applied: Free standard shipping.',
    ]);
    expect(reducer(state, { type: 'removePromo', code: 'welcome10' }).cart.promoCodes).toEqual(['SHIPFREE']);
  });

  it('unknown variants and lines are refused without changing the cart', () => {
    const state = run([{ type: 'addLine', product: mug, variantId: 'nope' }, { type: 'removeLine', lineId: 'line-9' }]);
    expect(state.cart).toEqual(carts.empty);
    expect(state.lastAction?.ok).toBe(false);
  });

  it('replaces, clears and sets the shipping method; never mutates fixtures', () => {
    const loaded = run([{ type: 'replaceCart', cart: carts.mixed }, { type: 'setShippingMethod', methodId: 'ship-express' }, { type: 'addLine', product: mug, variantId: 'mug-default' }]);
    expect(loaded.cart.shippingMethodId).toBe('ship-express');
    expect(loaded.cart.lines.at(-1)!.id).toBe('line-5');
    expect(carts.mixed.shippingMethodId).toBeUndefined();
    const cleared = reducer(loaded, { type: 'clear' });
    expect(cleared.cart).toEqual({ id: carts.mixed.id, currency: 'USD', lines: [], promoCodes: [] });
  });
});
