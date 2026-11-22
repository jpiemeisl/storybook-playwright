import { describe, expect, it } from 'vitest';
import { accountData, accountSubscriptions, addressBooks, customers, DEMO_NOW } from '../../src/commerce/fixtures';
import { getSubscriptionStatusInfo } from '../../src/commerce/logic/account';
import { validateAddressBook, validateCustomerSubscription } from '../../src/commerce/logic/validate';
import { applyAccountAction, type DemoAccountAction, type DemoAccountState } from './accountReducer';

const start = (): DemoAccountState => ({ customer: customers.robin, ...structuredClone(accountData.rich), subscriptions: structuredClone(Object.values(accountSubscriptions)), addresses: structuredClone(addressBooks.three), nextAddress: 1, lastError: null });
const run = (action: DemoAccountAction, state = start(), fail = false) => applyAccountAction(state, action, { now: DEMO_NOW, fail });
const sub = (state: DemoAccountState, id: string) => state.subscriptions.find((s) => s.id === id)!;
const text = (state: DemoAccountState, id: string) => getSubscriptionStatusInfo(sub(state, id), DEMO_NOW).description;

describe('demo account reducer: subscriptions', () => {
  it('pause sets the resume date', () => {
    const { state, result } = run({ type: 'subscription', id: 'sub-a1', request: { type: 'pause', months: 2, resumesOn: '2026-05-21' } });
    expect(result).toEqual({ ok: true, message: 'Seasonal seed box is paused until May 21, 2026.' });
    expect(text(state, 'sub-a1')).toBe('Paused until May 21, 2026');
    expect(validateCustomerSubscription(sub(state, 'sub-a1'))).toEqual([]);
  });

  it('cancel, then undo; reactivate a cancelled one; resume a paused one; change plan', () => {
    let { state } = run({ type: 'subscription', id: 'sub-a2', request: { type: 'cancel', reason: 'It costs too much' } });
    expect(text(state, 'sub-a2')).toBe('Cancels on Apr 15, 2026');
    ({ state } = run({ type: 'subscription', id: 'sub-a2', request: { type: 'undo-cancel' } }, state));
    expect(text(state, 'sub-a2')).toBe('Renews on Apr 15, 2026');
    ({ state } = run({ type: 'subscription', id: 'sub-a8', request: { type: 'reactivate' } }, state));
    expect(text(state, 'sub-a8')).toBe('Renews on Mar 21, 2027');
    ({ state } = run({ type: 'subscription', id: 'sub-a5', request: { type: 'resume' } }, state));
    expect(sub(state, 'sub-a5')).toMatchObject({ status: 'active', nextBillingAt: '2026-06-21' });
    expect(sub(state, 'sub-a5').pausedUntil).toBeUndefined();
    // Next billing date: scheduled, the current plan stays until then.
    let scheduled;
    ({ state, result: scheduled } = run({ type: 'subscription', id: 'sub-a2', request: { type: 'change-plan', planId: 'club-annual', effective: 'next-billing-date' } }, state));
    expect(scheduled).toEqual({ ok: true, message: 'Grower club membership switches to Annual on Apr 15, 2026.' });
    expect(sub(state, 'sub-a2')).toMatchObject({ plan: 'Monthly', scheduledPlanChange: { planId: 'club-annual', effectiveAt: '2026-04-15' } });
    // Immediately: switched now, any scheduled change dropped.
    ({ state } = run({ type: 'subscription', id: 'sub-a2', request: { type: 'change-plan', planId: 'club-annual', effective: 'immediately' } }, state));
    expect(sub(state, 'sub-a2')).toMatchObject({ plan: 'Annual', price: { amount: 19200 } });
    expect(sub(state, 'sub-a2').scheduledPlanChange).toBeUndefined();
    expect(sub(state, 'sub-a2').availablePlans!.filter((p) => p.current).map((p) => p.id)).toEqual(['club-annual']);
    for (const s of state.subscriptions) expect(validateCustomerSubscription(s), s.id).toEqual([]);
  });

  it('rejects actions the status does not allow, unknown ids and the current plan', () => {
    const before = start();
    const paused = run({ type: 'subscription', id: 'sub-a5', request: { type: 'pause', months: 1, resumesOn: '2026-04-21' } }, before);
    expect(paused.result).toMatchObject({ ok: false, reason: 'not-allowed' });
    expect(paused.state.subscriptions).toEqual(before.subscriptions);
    expect(run({ type: 'subscription', id: 'nope', request: { type: 'resume' } }).result).toMatchObject({ ok: false, reason: 'not-found' });
    expect(run({ type: 'subscription', id: 'sub-a2', request: { type: 'change-plan', planId: 'club-monthly', effective: 'immediately' } }).result).toMatchObject({ ok: false, reason: 'not-allowed' });
    expect(run({ type: 'subscription', id: 'sub-a8', request: { type: 'cancel' } }).result).toMatchObject({ ok: false, reason: 'not-allowed' });
  });

  it('the failure flag rejects a valid action and records the error', () => {
    const { state, result } = run({ type: 'subscription', id: 'sub-a1', request: { type: 'cancel' } }, start(), true);
    expect(result).toMatchObject({ ok: false, reason: 'server' });
    expect(state.lastError).toMatchObject({ scope: 'sub-a1' });
    expect(sub(state, 'sub-a1').cancelAtPeriodEnd).toBeUndefined();
  });
});

describe('demo account reducer: addresses and wishlist', () => {
  it('adds, edits, deletes and moves defaults while keeping the invariants', () => {
    let { state } = run({ type: 'saveAddress', address: { label: 'Cabin', name: 'Robin Vale', line1: '1 Pine Road', city: 'Sisters', region: 'OR', postalCode: '97759', country: 'US' } });
    expect(state.addresses.at(-1)).toMatchObject({ id: 'adr-new-1', label: 'Cabin' });
    ({ state } = run({ type: 'setDefaultAddress', id: 'adr-new-1', kind: 'billing' }, state));
    expect(state.addresses.filter((a) => a.isDefaultBilling).map((a) => a.id)).toEqual(['adr-new-1']);
    ({ state } = run({ type: 'deleteAddress', id: 'adr-1' }, state));
    expect(state.addresses.find((a) => a.isDefaultShipping)?.id).toBe('adr-2');
    ({ state } = run({ type: 'saveAddress', address: { ...state.addresses[0]!, line2: 'Unit 9' } }, state));
    expect(state.addresses[0]!.line2).toBe('Unit 9');
    expect(validateAddressBook(state.addresses)).toEqual([]);
  });

  it('first address becomes both defaults; the 10-address limit and unknown ids are rejected', () => {
    const empty = { ...start(), addresses: [] };
    const { state } = run({ type: 'saveAddress', address: { name: 'A', line1: '1 A St', city: 'B', region: 'OR', postalCode: '97201', country: 'US' } }, empty);
    expect(state.addresses[0]).toMatchObject({ isDefaultShipping: true, isDefaultBilling: true });
    expect(run({ type: 'saveAddress', address: { name: 'A', line1: '1', city: 'B', region: 'OR', postalCode: '97201', country: 'US' } }, { ...start(), addresses: addressBooks.ten }).result).toMatchObject({ ok: false, reason: 'not-allowed' });
    expect(run({ type: 'deleteAddress', id: 'nope' }).result).toMatchObject({ ok: false, reason: 'not-found' });
  });

  it('removes wishlist items', () => {
    const { state, result } = run({ type: 'removeWishlistItem', productId: 'prod-lamp' });
    expect(result.ok).toBe(true);
    expect(state.wishlist.map((w) => w.productId)).not.toContain('prod-lamp');
    expect(run({ type: 'removeWishlistItem', productId: 'nope' }).result.ok).toBe(false);
  });
});

describe('demo account reducer: demo shop actions', () => {
  it('recordOrder adds the order, its downloads and its subscriptions (trial kept)', async () => {
    const { confirmationOrders } = await import('../../src/commerce/fixtures');
    const order = confirmationOrders.mixed;
    const { state, result } = run({ type: 'recordOrder', order });
    expect(result.ok).toBe(true);
    expect(state.orders[0]).toBe(order);
    expect(state.downloads[0]!.files.map((f) => f.fileId)).toEqual(order.downloads!.map((d) => d.fileId));
    const added = state.subscriptions.filter((s) => s.id.startsWith(`sub-${order.number}`));
    expect(added).toHaveLength(order.recurring!.length);
    added.forEach((s) => expect(validateCustomerSubscription(s)).toEqual([]));
  });

  it('signs in as the demo customer and out again', () => {
    let { state } = run({ type: 'signOut' });
    expect(state.customer).toBeNull();
    ({ state } = run({ type: 'signIn' }, state));
    expect(state.customer).toEqual(customers.robin);
  });
});
