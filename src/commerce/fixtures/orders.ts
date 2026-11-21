import { computeCartTotals } from '../logic/cart';
import type { Cart } from '../types/cart';
import type { CustomerSubscription, Order, OrderStatus } from '../types/order';
import { carts } from './carts';
import { addresses, DEMO_NOW, promoDefinitions, shippingMethods } from './store';

/** An order from a cart fixture, with totals from computeCartTotals (so they always add up). */
function order(id: string, number: string, status: OrderStatus, placedAt: string, cart: Cart, extra: Partial<Order> = {}): Order {
  const t = computeCartTotals(cart, { promoDefinitions, shippingMethods, now: placedAt });
  return {
    id,
    number,
    placedAt,
    status,
    lines: cart.lines,
    totals: { subtotal: t.subtotal, discount: t.discount, shipping: t.shipping, tax: t.tax, total: t.total },
    ...(t.flags.hasShippable ? { shippingAddress: addresses.home, shippingMethod: t.shippingMethod } : {}),
    billingAddress: addresses.home,
    ...extra,
  };
}

const downloads = carts.digitalOnly.lines.length;

export const orders = {
  shipped: order('ord-1001', 'FH-1001', 'shipped', '2026-03-12T14:20:00Z', carts.physicalOnly, {
    tracking: { carrier: 'Parcelway', number: 'PW2048813377', events: [{ at: '2026-03-12T16:00:00Z', label: 'Label created' }, { at: '2026-03-13T07:45:00Z', label: 'Picked up' }, { at: '2026-03-14T11:30:00Z', label: 'In transit' }] },
  }),
  delivered: order('ord-0998', 'FH-0998', 'delivered', '2026-02-27T09:05:00Z', carts.withPromo, {
    tracking: { carrier: 'Parcelway', number: 'PW2047700021', events: [{ at: '2026-02-27T12:00:00Z', label: 'Picked up' }, { at: '2026-03-01T10:15:00Z', label: 'Delivered' }] },
  }),
  digitalReady: order('ord-1003', 'FH-1003', 'delivered', '2026-03-18T20:10:00Z', carts.digitalOnly, {
    downloads: [
      { fileId: 'guide-pdf', name: 'small-garden-guide.pdf', available: true },
      { fileId: 'bundle-plans', name: 'planting-plans.zip', available: true, expiresAt: '2027-03-18' },
      { fileId: 'calendar-pdf', name: 'planting-calendar.pdf', available: true },
    ].slice(0, downloads),
  }),
  processing: order('ord-1004', 'FH-1004', 'processing', DEMO_NOW, carts.physicalOnly),
  cancelled: order('ord-0990', 'FH-0990', 'cancelled', '2026-02-10T11:00:00Z', carts.withOutOfStockLine),
  refunded: order('ord-0985', 'FH-0985', 'refunded', '2026-01-22T15:30:00Z', carts.physicalOnly),
  mixed: order('ord-1002', 'FH-1002', 'processing', '2026-03-15T10:00:00Z', carts.mixed, {
    downloads: [{ fileId: 'guide-pdf', name: 'small-garden-guide.pdf', available: true }],
  }),
} satisfies Record<string, Order>;

const usd = (amount: number) => ({ amount, currency: 'USD' });

export const customerSubscriptions = {
  trialing: { id: 'sub-1', productTitle: 'Garden planner app', plan: 'Monthly', price: usd(600), interval: { unit: 'month', count: 1 }, status: 'trialing', startedAt: '2026-03-14', trialEndsAt: '2026-03-28', nextBillingAt: '2026-03-28' },
  active: { id: 'sub-2', productTitle: 'Seasonal seed box', plan: 'Monthly', price: usd(1800), interval: { unit: 'month', count: 1 }, status: 'active', startedAt: '2025-09-01', nextBillingAt: '2026-04-01' },
  pastDue: { id: 'sub-3', productTitle: 'House coffee beans', plan: 'Every week (250 g)', price: usd(1260), interval: { unit: 'week', count: 1 }, status: 'past-due', startedAt: '2025-11-03', nextBillingAt: '2026-03-17' },
  paused: { id: 'sub-4', productTitle: 'Grower club membership', plan: 'Quarterly', price: usd(5400), interval: { unit: 'month', count: 3 }, status: 'paused', startedAt: '2025-06-01', nextBillingAt: '2026-06-01', pausedUntil: '2026-06-01' },
  cancelled: { id: 'sub-5', productTitle: 'Grower club membership', plan: 'Annual', price: usd(19200), interval: { unit: 'year', count: 1 }, status: 'cancelled', startedAt: '2024-03-01', cancelledAt: '2026-02-28' },
} satisfies Record<string, CustomerSubscription>;
