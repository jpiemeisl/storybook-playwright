/*
 * Account subscriptions and invoices. Dates are relative to DEMO_NOW (2026-03-21T09:00:00Z): the
 * trial ends in 6 days (Mar 27), the active one renews Apr 1, the paused one resumes Jun 1.
 */
import type { Invoice, SubscriptionPlanOption } from '../../types/account';
import type { CustomerSubscription } from '../../types/order';
import { addInterval } from '../../logic/pricing';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const month = { unit: 'month', count: 1 } as const;

/** Four plans for the grower club (Monthly is current). */
export const clubPlans: SubscriptionPlanOption[] = [
  { id: 'club-monthly', name: 'Monthly', price: usd(2000), interval: month, features: ['Monthly seed drop', 'Members’ forum'], current: true },
  { id: 'club-monthly-plus', name: 'Monthly Plus', price: usd(2800), interval: month, features: ['Monthly seed drop', 'Members’ forum', 'One live Q&A a month'] },
  { id: 'club-quarterly', name: 'Quarterly', price: usd(5400), interval: { unit: 'month', count: 3 }, features: ['Seed drop every month', 'Members’ forum', 'Save 10%'] },
  { id: 'club-annual', name: 'Annual', price: usd(19200), interval: { unit: 'year', count: 1 }, features: ['Seed drop every month', 'Members’ forum', 'Save 20%', 'Free tote'] },
];

/** A single plan: nothing to change to. */
export const seedBoxPlans: SubscriptionPlanOption[] = [{ id: 'seed-box-monthly', name: 'Monthly', price: usd(1800), interval: month, features: ['Six seasonal varieties'], current: true }];

const card = 'Card ending 4242';

export const accountSubscriptions = {
  active: { id: 'sub-a1', productId: 'prod-seed-box', productTitle: 'Seasonal seed box', plan: 'Monthly', price: usd(1800), interval: month, status: 'active', startedAt: '2025-09-01', nextBillingAt: '2026-04-01', currentPeriodEnd: '2026-04-01', paymentMethodSummary: card, availablePlans: seedBoxPlans },
  withPlans: { id: 'sub-a2', productId: 'prod-club', productTitle: 'Grower club membership', plan: 'Monthly', price: usd(2000), interval: month, status: 'active', startedAt: '2025-11-15', nextBillingAt: '2026-04-15', currentPeriodEnd: '2026-04-15', paymentMethodSummary: card, availablePlans: clubPlans },
  trialing: { id: 'sub-a3', productId: 'prod-planner', productTitle: 'Garden planner app', plan: 'Monthly', price: usd(600), interval: month, status: 'trialing', startedAt: '2026-03-13', trialEndsAt: '2026-03-27', nextBillingAt: '2026-03-27', currentPeriodEnd: '2026-03-27', paymentMethodSummary: card },
  pastDue: { id: 'sub-a4', productId: 'prod-coffee', productTitle: 'House coffee beans', plan: 'Every week (250 g)', price: usd(1260), interval: { unit: 'week', count: 1 }, status: 'past-due', startedAt: '2025-11-03', nextBillingAt: '2026-03-17', paymentMethodSummary: 'Card ending 0019' },
  paused: { id: 'sub-a5', productId: 'prod-club', productTitle: 'Grower club membership', plan: 'Quarterly', price: usd(5400), interval: { unit: 'month', count: 3 }, status: 'paused', startedAt: '2025-06-01', pausedUntil: '2026-06-01', nextBillingAt: '2026-06-01', paymentMethodSummary: card },
  pausedOpenEnded: { id: 'sub-a6', productId: 'prod-seed-box', productTitle: 'Seasonal seed box', plan: 'Monthly', price: usd(1800), interval: month, status: 'paused', startedAt: '2025-04-01', pauseOpenEnded: true, paymentMethodSummary: card },
  cancelling: { id: 'sub-a7', productId: 'prod-planner', productTitle: 'Garden planner app', plan: 'Monthly', price: usd(600), interval: month, status: 'active', startedAt: '2025-12-02', nextBillingAt: '2026-04-02', currentPeriodEnd: '2026-04-02', cancelAtPeriodEnd: true, paymentMethodSummary: card },
  cancelled: { id: 'sub-a8', productId: 'prod-club', productTitle: 'Grower club membership', plan: 'Annual', price: usd(19200), interval: { unit: 'year', count: 1 }, status: 'cancelled', startedAt: '2024-03-01', cancelledAt: '2026-02-28', paymentMethodSummary: card },
} satisfies Record<string, CustomerSubscription>;

export type AccountSubscriptionKey = keyof typeof accountSubscriptions;

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** An invoice; pass `href: null` for one without a PDF yet. */
function invoice(id: string, issuedAt: string, description: string, amount: number, status: Invoice['status'], extra: Partial<Omit<Invoice, 'href'>> & { href?: string | null } = {}): Invoice {
  const { href = `/account/invoices/${id}.pdf`, ...rest } = extra;
  return { id, number: `INV-${issuedAt.slice(0, 4)}-${id.replace(/\D/g, '').padStart(4, '0')}`, issuedAt, description, amount: usd(amount), status, ...(href ? { href } : {}), ...rest };
}

/** 24 monthly seed box invoices, Apr 2024 to Mar 2026 (two paid years plus this one), newest last. */
const monthly = Array.from({ length: 24 }, (_, i) => {
  const issuedAt = addInterval('2024-04-01', { unit: 'month', count: i });
  return invoice(`i${100 + i}`, issuedAt, `Seasonal seed box, ${MONTHS[Number(issuedAt.slice(5, 7)) - 1]} ${issuedAt.slice(0, 4)}`, 1800, 'paid', { subscriptionId: 'sub-a1' });
});

export const invoiceSets = {
  none: [] as Invoice[],
  three: [
    invoice('i1', '2026-03-01', 'Seasonal seed box, March 2026', 1800, 'paid', { subscriptionId: 'sub-a1' }),
    invoice('i2', '2026-03-17', 'House coffee beans, week of Mar 17', 1260, 'failed', { subscriptionId: 'sub-a4' }),
    invoice('i3', '2026-02-15', 'Grower club membership, February 2026', 2000, 'paid', { subscriptionId: 'sub-a2' }),
  ],
  /** One of each status. */
  statuses: [
    invoice('i11', '2026-03-12', 'Order FH-1001', 8635, 'paid', { orderId: 'ord-1001' }),
    invoice('i12', '2026-03-20', 'Grower club membership, April 2026', 2000, 'open', { subscriptionId: 'sub-a2', href: null }),
    invoice('i13', '2026-03-17', 'House coffee beans, week of Mar 17', 1260, 'failed', { subscriptionId: 'sub-a4' }),
    invoice('i14', '2026-01-22', 'Order FH-0985', 8635, 'refunded', { orderId: 'ord-0985' }),
  ],
  twentyFour: monthly,
};
