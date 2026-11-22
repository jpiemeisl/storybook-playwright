import { describe, expect, it } from 'vitest';
import { accountOrders, accountSubscriptions, addressBooks, clubPlans, DEMO_NOW, invoiceSets, libraries, type AccountSubscriptionKey } from '../fixtures';
import type { SavedAddress, SubscriptionPlanOption } from '../types/account';
import {
  buildOrderTimeline,
  computePauseResumeDate,
  daysUntil,
  getAttentionItems,
  getDefaultAddress,
  getOrderSections,
  getOrderStatusInfo,
  getPlanChangeSummary,
  getSubscriptionActions,
  getSubscriptionStatusInfo,
  groupInvoicesByYear,
  isAccountEmpty,
  removeAddress,
  setDefaultAddress,
} from './account';
import { CurrencyMismatchError } from './money';

const steps = (key: keyof typeof accountOrders) => buildOrderTimeline(accountOrders[key]).map((s) => `${s.id}:${s.state}`).join(' ');

describe('orders', () => {
  it('status info has text and a tone for every status; digital-only orders read Complete', () => {
    expect(getOrderStatusInfo(accountOrders.shipped)).toMatchObject({ label: 'Shipped', tone: 'info' });
    expect(getOrderStatusInfo(accountOrders.delivered)).toMatchObject({ label: 'Delivered', tone: 'success' });
    expect(getOrderStatusInfo(accountOrders.cancelled)).toMatchObject({ label: 'Cancelled', tone: 'neutral' });
    expect(getOrderStatusInfo(accountOrders.refunded)).toMatchObject({ label: 'Refunded' });
    expect(getOrderStatusInfo(accountOrders.processing).label).toBe('Processing');
    expect(getOrderStatusInfo(accountOrders.digital).label).toBe('Complete');
  });

  it('builds deterministic timelines per status and kind', () => {
    expect(steps('processing')).toBe('placed:done preparing:current shipped:upcoming delivered:upcoming');
    expect(steps('shipped')).toBe('placed:done preparing:done shipped:current delivered:upcoming');
    expect(steps('delivered')).toBe('placed:done preparing:done shipped:done delivered:done');
    expect(steps('cancelled')).toBe('placed:done cancelled:current');
    expect(steps('digital')).toBe('placed:done downloads:done');
    expect(steps('subscriptionTrial')).toBe('placed:done subscription:done');
    expect(steps('mixed')).toBe('placed:done subscription:done downloads:done preparing:current shipped:upcoming delivered:upcoming');
    expect(buildOrderTimeline(accountOrders.shipped).find((s) => s.id === 'shipped')?.at).toBe('2026-03-12T16:00:00Z');
    expect(buildOrderTimeline(accountOrders.delivered).find((s) => s.id === 'delivered')?.at).toBe('2026-03-01T10:15:00Z');
  });

  it('knows which sections apply', () => {
    expect(getOrderSections(accountOrders.digital)).toEqual({ shipping: false, tracking: false, downloads: true, subscriptions: false, billingAddress: true });
    expect(getOrderSections(accountOrders.mixed)).toEqual({ shipping: true, tracking: false, downloads: true, subscriptions: true, billingAddress: true });
    expect(getOrderSections(accountOrders.shipped).tracking).toBe(true);
  });
});

describe('subscription status text', () => {
  const text = (key: AccountSubscriptionKey) => getSubscriptionStatusInfo(accountSubscriptions[key], DEMO_NOW).description;

  it('describes each status from data and `now`', () => {
    expect(text('active')).toBe('Renews on Apr 1, 2026');
    expect(text('trialing')).toBe('Trial ends in 6 days');
    expect(text('paused')).toBe('Paused until Jun 1, 2026');
    expect(text('pausedOpenEnded')).toBe('Paused until you resume it');
    expect(text('pastDue')).toBe('Payment failed: update your payment method');
    expect(text('cancelling')).toBe('Cancels on Apr 2, 2026');
    expect(text('cancelled')).toBe('Cancelled on Feb 28, 2026');
  });

  it('counts trial days in calendar days, across year boundaries', () => {
    const trial = { ...accountSubscriptions.trialing, trialEndsAt: '2027-01-03' };
    expect(getSubscriptionStatusInfo(trial, '2026-12-28T23:59:00Z').description).toBe('Trial ends in 6 days');
    expect(getSubscriptionStatusInfo(trial, '2027-01-02T00:01:00Z').description).toBe('Trial ends tomorrow');
    expect(getSubscriptionStatusInfo(trial, '2027-01-03T18:00:00Z').description).toBe('Trial ends today');
    expect(daysUntil('2028-03-01', '2028-02-28T12:00:00Z')).toBe(2); // leap year
  });
});

describe('subscription actions', () => {
  /** The matrix documented in docs/commerce-account.md. */
  const matrix: Record<AccountSubscriptionKey, string> = {
    active: 'pause cancel update-payment',
    withPlans: 'pause change-plan cancel update-payment',
    trialing: 'pause cancel update-payment',
    pastDue: 'cancel update-payment',
    paused: 'resume cancel update-payment',
    pausedOpenEnded: 'resume cancel update-payment',
    cancelling: 'undo-cancel update-payment',
    cancelled: 'reactivate',
  };
  it.each(Object.keys(matrix) as AccountSubscriptionKey[])('%s', (key) => {
    expect(getSubscriptionActions(accountSubscriptions[key]).join(' ')).toBe(matrix[key]);
  });
});

describe('computePauseResumeDate', () => {
  it('adds 1, 2 or 3 months and clamps month ends', () => {
    expect(computePauseResumeDate(DEMO_NOW, 1)).toBe('2026-04-21');
    expect(computePauseResumeDate('2026-01-31T09:00:00Z', 1)).toBe('2026-02-28');
    expect(computePauseResumeDate('2028-01-31T09:00:00Z', 1)).toBe('2028-02-29');
    expect(computePauseResumeDate('2026-03-31T09:00:00Z', 2)).toBe('2026-05-31');
    expect(computePauseResumeDate('2026-11-30T09:00:00Z', 3)).toBe('2027-02-28');
    expect(computePauseResumeDate('2026-12-15T09:00:00Z', 1)).toBe('2027-01-15');
  });
});

describe('getPlanChangeSummary', () => {
  const [monthly, plus, quarterly, annual] = clubPlans as [SubscriptionPlanOption, SubscriptionPlanOption, SubscriptionPlanOption, SubscriptionPlanOption];

  it('compares yearly cost: upgrade, downgrade or switch', () => {
    expect(getPlanChangeSummary(monthly, plus, { nextBillingAt: '2026-04-15' })).toEqual({
      direction: 'upgrade',
      priceDifference: { amount: 800, currency: 'USD' },
      effective: 'next-billing-date',
      effectiveText: 'Your plan changes to Monthly Plus ($28.00 / month) on Apr 15, 2026. You keep Monthly until then. Nothing is charged today.',
    });
    expect(getPlanChangeSummary(monthly, quarterly).direction).toBe('downgrade'); // $216 a year vs $240
    expect(getPlanChangeSummary(monthly, annual).direction).toBe('downgrade');
    expect(getPlanChangeSummary(annual, plus).direction).toBe('upgrade');
    expect(getPlanChangeSummary(monthly, { ...monthly, id: 'x', name: 'Monthly (new)' }).direction).toBe('switch');
    expect(getPlanChangeSummary(monthly, quarterly).effectiveText).toMatch(/at your next billing date/);
  });

  it('the text follows the host’s timing', () => {
    expect(getPlanChangeSummary(monthly, annual, { effective: 'immediately', nextBillingAt: '2026-04-15' })).toMatchObject({
      effective: 'immediately',
      effectiveText: 'Your plan changes to Annual ($192.00 / year) today. Your next charge, on Apr 15, 2026, uses the new price. Nothing is charged today.',
    });
    expect(getPlanChangeSummary(monthly, annual, { effective: 'immediately' }).effectiveText).toMatch(/today\. Your next charge uses the new price/);
  });

  it('throws on a currency mismatch', () => {
    expect(() => getPlanChangeSummary(monthly, { ...plus, price: { amount: 2800, currency: 'EUR' } })).toThrow(CurrencyMismatchError);
  });
});

describe('invoices and addresses', () => {
  it('groups invoices by year, newest first', () => {
    const groups = groupInvoicesByYear(invoiceSets.twentyFour);
    expect(groups.map((g) => [g.year, g.invoices.length])).toEqual([
      ['2026', 3],
      ['2025', 12],
      ['2024', 9],
    ]);
    expect(groups[0]!.invoices[0]!.issuedAt).toBe('2026-03-01');
    expect(groupInvoicesByYear([])).toEqual([]);
  });

  const defaults = (book: SavedAddress[]) => [getDefaultAddress(book, 'shipping')?.id, getDefaultAddress(book, 'billing')?.id];

  it('setDefaultAddress keeps exactly one default per kind and returns a new array', () => {
    const book = addressBooks.three;
    const next = setDefaultAddress(book, 'adr-2', 'shipping');
    expect(next).not.toBe(book);
    expect(defaults(next)).toEqual(['adr-2', 'adr-1']);
    expect(next.filter((a) => a.isDefaultShipping)).toHaveLength(1);
    expect(defaults(book)).toEqual(['adr-1', 'adr-1']); // input untouched
    expect(setDefaultAddress(book, 'nope', 'billing')).toEqual(book);
  });

  it('removeAddress reassigns defaults to the first remaining address', () => {
    expect(defaults(removeAddress(addressBooks.three, 'adr-1'))).toEqual(['adr-2', 'adr-2']);
    expect(defaults(removeAddress(addressBooks.three, 'adr-3'))).toEqual(['adr-1', 'adr-1']);
    expect(removeAddress(addressBooks.one, 'adr-1')).toEqual([]);
    expect(removeAddress(addressBooks.three, 'nope')).toEqual(addressBooks.three);
  });
});

describe('dashboard', () => {
  it('knows an empty account and lists what needs attention', () => {
    const empty = { orders: [], subscriptions: [], invoices: [], downloads: [], addresses: [], wishlist: [] };
    expect(isAccountEmpty(empty)).toBe(true);
    expect(isAccountEmpty({ ...empty, addresses: addressBooks.one })).toBe(false);
    const items = getAttentionItems({ subscriptions: Object.values(accountSubscriptions), invoices: invoiceSets.statuses, downloads: libraries.six });
    expect(items.map((i) => i.kind)).toEqual(['subscription-past-due', 'invoice-failed', 'download-unavailable', 'download-unavailable']);
    expect(items[0]).toMatchObject({ href: '/account/subscriptions/sub-a4' });
  });
});
