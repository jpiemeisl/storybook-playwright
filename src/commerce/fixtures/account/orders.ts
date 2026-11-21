/*
 * Order histories for the account area: deterministic (seeded) generation from cart fixtures with
 * createOrderFromCart, so totals always match their carts. Newest first. Seed 20260321.
 */
import { createOrderFromCart } from '../../logic/checkout';
import { addDays } from '../../logic/pricing';
import type { Order, OrderStatus } from '../../types/order';
import { carts, type CartFixtureKey } from '../carts';
import { checkoutValuesForCart, confirmationOrders } from '../checkout';
import { orders } from '../orders';
import { products } from '../products';
import { DEMO_NOW, promoDefinitions, shippingMethods } from '../store';

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SOURCES: CartFixtureKey[] = ['physicalOnly', 'digitalOnly', 'mixed', 'oneLine', 'withPromo', 'subscriptionOnly', 'freeShippingAt', 'longTitles', 'subscriptionWithTrial', 'twentyLines'];
const at = (date: string, time = '10:00:00Z') => `${date}T${time}`;

/** `count` orders, newest first: recent ones processing or shipped, older ones delivered, some cancelled or refunded. */
export function generateOrderHistory(count: number, seed = 20260321): Order[] {
  const random = mulberry32(seed);
  let daysAgo = 1;
  return Array.from({ length: count }, (_, i) => {
    const key = SOURCES[Math.floor(random() * SOURCES.length)]!;
    daysAgo += 2 + Math.floor(random() * 9);
    const day = addDays(DEMO_NOW, -daysAgo);
    const roll = random();
    const status: OrderStatus = i === 0 ? 'processing' : i === 1 ? 'shipped' : roll < 0.08 ? 'cancelled' : roll < 0.14 ? 'refunded' : 'delivered';
    const cart = carts[key];
    const order = createOrderFromCart(cart, checkoutValuesForCart(key), { orderId: `ord-h${seed % 1000}-${i + 1}`, orderNumber: `FH-${3000 + count * 10 + i}`, placedAt: at(day), promoDefinitions, shippingMethods, products });
    const ships = cart.lines.some((l) => l.snapshot.requiresShipping);
    const tracked = ships && (status === 'shipped' || status === 'delivered');
    return {
      ...order,
      status,
      ...(tracked
        ? {
            tracking: {
              carrier: 'Parcelway',
              number: `PW${String(2049000000 + i * 7919 + count)}`,
              events: [
                { at: at(addDays(day, 1), '08:00:00Z'), label: 'Picked up' },
                { at: at(addDays(day, 2), '14:30:00Z'), label: 'In transit' },
                ...(status === 'delivered' ? [{ at: at(addDays(day, 3), '11:15:00Z'), label: 'Delivered' }] : []),
              ],
            },
          }
        : {}),
    };
  });
}

/** Earlier fixtures reused: one order per status and kind. */
export const accountOrders = {
  processing: orders.processing,
  shipped: orders.shipped,
  delivered: orders.delivered,
  cancelled: orders.cancelled,
  refunded: orders.refunded,
  digital: confirmationOrders.digital,
  subscriptionTrial: confirmationOrders.subscriptionTrial,
  mixed: confirmationOrders.mixed,
} satisfies Record<string, Order>;

export const orderHistories = {
  none: [] as Order[],
  three: [accountOrders.mixed, accountOrders.shipped, accountOrders.delivered],
  twelve: generateOrderHistory(12),
  sixty: generateOrderHistory(60),
};
