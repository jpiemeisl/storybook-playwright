/*
 * Story-only helpers for cart and checkout stories: totals for fixture carts with the demo context,
 * and a product href. Not exported from the commerce barrel.
 */
import { carts, DEMO_NOW, products, promoDefinitions, shippingMethods, type CartFixtureKey } from '../fixtures';
import { computeCartTotals, type CartTotals } from '../logic/cart';
import { getCartIssues, getCartNotes } from '../logic/cartLines';
import type { Cart, CartLine } from '../types/cart';

export const cartContext = { promoDefinitions, shippingMethods, now: DEMO_NOW };

export const totalsFor = (cart: Cart): CartTotals => computeCartTotals(cart, cartContext);

/** Everything a cart view needs for a fixture: the cart, totals, issues and catalogue-aware notes. */
export function cartView(key: CartFixtureKey) {
  const cart = carts[key];
  return { cart, totals: totalsFor(cart), issues: getCartIssues(cart, products), notes: getCartNotes(cart, products) };
}

/** The `amounts` for one line of a cart. */
const handles = new Map(products.map((p) => [p.id, p.handle]));
export const lineHref = (line: CartLine) => `/products/${handles.get(line.productId) ?? line.productId}`;

/** Story wrapper that fixes a container width, to show container-query layouts. */
export function Width({ rem, children }: { rem: number; children: React.ReactNode }) {
  return <div style={{ inlineSize: `min(${rem}rem, 100%)` }}>{children}</div>;
}
