import { cartLineFromProduct } from '../logic/lines';
import type { Cart, CartLine } from '../types/cart';
import type { Product, PurchaseOption } from '../types/product';
import { bundle, calendar, candle, club, coffee, guide, kettle, lamp, longTitle, mug, plannerApp, products, seedBox, seedPacket, socks, stool, tee, tote } from './products';

function line(product: Product, variantId: string, quantity: number, id: string, option?: PurchaseOption): CartLine {
  const built = cartLineFromProduct(product, variantId, quantity, id, option);
  if (!built) throw new Error(`Fixture variant ${variantId} not found`);
  return built;
}
const cart = (id: string, lines: CartLine[], extra: Partial<Cart> = {}): Cart => ({ id, lines, promoCodes: [], currency: 'USD', ...extra });
const sub = (product: Product, index = 0) => product.purchaseOptions[index];

export const carts = {
  empty: cart('cart-empty', []),
  // $74.00: one dollar under the free-shipping threshold.
  physicalOnly: cart('cart-physical', [line(mug, 'mug-default', 1, 'l1'), line(tee, 'tee-m-moss', 1, 'l2'), line(candle, 'candle-default', 1, 'l3')], { shippingMethodId: 'ship-standard' }),
  digitalOnly: cart('cart-digital', [line(guide, 'guide-default', 1, 'l1'), line(bundle, 'bundle-team', 1, 'l2'), line(calendar, 'calendar-default', 1, 'l3')]),
  subscriptionOnly: cart('cart-subscription', [line(seedBox, 'seed-box-default', 1, 'l1'), line(club, 'club-default', 1, 'l2', sub(club, 1))]),
  mixed: cart('cart-mixed', [line(tote, 'tote-default', 1, 'l1'), line(coffee, 'coffee-250', 2, 'l2', sub(coffee, 2)), line(guide, 'guide-default', 1, 'l3'), line(seedBox, 'seed-box-default', 1, 'l4')]),
  twentyLines: cart(
    'cart-twenty',
    products
      .filter((p) => p.kind === 'physical' && p.variants.some((v) => v.stock.status !== 'out-of-stock'))
      .flatMap((p) => p.variants.filter((v) => v.stock.status !== 'out-of-stock').slice(0, p.variants.length > 10 ? 6 : 3).map((v) => ({ p, v })))
      .slice(0, 20)
      .map(({ p, v }, i) => line(p, v.id, 1 + (i % 3), `l${i + 1}`)),
  ),
  withPromo: cart('cart-promo', [line(tee, 'tee-l-moss', 2, 'l1'), line(stool, 'stool-default', 1, 'l2')], { promoCodes: ['WELCOME10', 'SHIPFREE'], shippingMethodId: 'ship-express' }),
  withOutOfStockLine: cart('cart-oos', [line(mug, 'mug-default', 1, 'l1'), line(lamp, 'lamp-brass', 1, 'l2')]),
  subscriptionTrial: cart('cart-trial', [line(plannerApp, 'planner-default', 1, 'l1'), line(kettle, 'kettle-default', 1, 'l2'), line(seedPacket, 'seed-packet-default', 3, 'l3')]),
  // Phase 11 checkout fixtures.
  oneLine: cart('cart-one', [line(mug, 'mug-default', 1, 'l1')]),
  quantityAboveStock: cart('cart-over-stock', [line(candle, 'candle-default', 5, 'l1'), line(tote, 'tote-default', 1, 'l2')]),
  // $74.99 subtotal: one cent under free shipping.
  freeShippingBelow: cart('cart-ship-7499', [line(mug, 'mug-default', 1, 'l1'), line(tee, 'tee-m-moss', 1, 'l2'), line(candle, 'candle-default', 1, 'l3'), line(seedPacket, 'seed-packet-default', 1, 'l4')]),
  // $75.00 subtotal: exactly at the free-shipping threshold.
  freeShippingAt: cart('cart-ship-7500', [line(mug, 'mug-default', 1, 'l1'), line(tee, 'tee-m-moss', 1, 'l2'), line(tote, 'tote-default', 1, 'l3')]),
  // Subscription-only, one line with a 14-day trial.
  subscriptionWithTrial: cart('cart-sub-trial', [line(plannerApp, 'planner-default', 1, 'l1'), line(seedBox, 'seed-box-default', 1, 'l2')]),
  multipleIntervals: cart('cart-intervals', [line(coffee, 'coffee-250', 1, 'l1', sub(coffee, 1)), line(seedBox, 'seed-box-default', 1, 'l2'), line(club, 'club-default', 1, 'l3', sub(club, 1)), line(club, 'club-default', 1, 'l4', sub(club, 2))]),
  longTitles: cart('cart-long', [line(longTitle, 'long-extended', 2, 'l1'), line(socks, 'socks-m-moss', 1, 'l2'), line(bundle, 'bundle-team', 1, 'l3')]),
} satisfies Record<string, Cart>;

export type CartFixtureKey = keyof typeof carts;

