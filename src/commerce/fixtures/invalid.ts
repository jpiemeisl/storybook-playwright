/*
 * DELIBERATELY INVALID fixtures: each exists to prove a validator rule catches it. Never use these
 * as sample data. Each entry lists the issues (code@path) the validator must report.
 */
import type { Cart, Order, Product } from '../types';
import { carts } from './carts';
import { orders } from './orders';
import { coffee, guide, mug, seedBox, tee } from './products';

const clone = <T,>(value: T): T => structuredClone(value);
const mutate = <T,>(value: T, change: (copy: T) => void): T => {
  const copy = clone(value);
  change(copy);
  return copy;
};

export const invalidProducts: { name: string; value: unknown; expect: string[] }[] = [
  { name: 'fractional price', value: mutate(mug, (p) => (p.variants[0]!.price.amount = 24.5)), expect: ['invalid-field@variants[0].price.amount'] },
  { name: 'mixed currencies', value: mutate(coffee, (p) => (p.variants[1]!.price = { amount: 4600, currency: 'EUR' })), expect: ['invalid-field@variants'] },
  { name: 'undeclared option value', value: mutate(tee, (p) => (p.variants[0]!.optionValues.Size = 'XXXL')), expect: ['invalid-field@variants[0].optionValues.Size'] },
  { name: 'subscription product with a one-time option', value: mutate(seedBox, (p) => p.purchaseOptions.push({ type: 'one-time' })), expect: ['invalid-field@purchaseOptions'] },
  { name: 'digital product without files', value: mutate(guide, (p) => (p.digital!.files = [])), expect: ['too-few@digital.files'] },
  { name: 'duplicate variant ids', value: mutate(coffee, (p) => (p.variants[1]!.id = p.variants[0]!.id)), expect: ['duplicate-id@variants[1].id'] },
  { name: 'unsafe image', value: mutate(mug, (p) => (p.images[0]!.src = 'javascript:alert(1)')), expect: ['unsafe-src@images[0].src'] },
  { name: 'compare-at not higher', value: mutate(mug, (p) => (p.variants[0]!.compareAtPrice = { amount: 2000, currency: 'USD' })), expect: ['invalid-field@variants[0].compareAtPrice'] },
];

export const invalidCarts: { name: string; value: Cart; expect: string[] }[] = [
  { name: 'zero quantity', value: mutate(carts.physicalOnly, (c) => (c.lines[0]!.quantity = 0)), expect: ['invalid-field@lines[0].quantity'] },
  { name: 'line in another currency', value: mutate(carts.digitalOnly, (c) => (c.lines[0]!.snapshot.unitPrice.currency = 'GBP')), expect: ['invalid-field@lines[0].snapshot.unitPrice.currency'] },
  { name: 'subscription product bought one-time', value: mutate(carts.subscriptionOnly, (c) => (c.lines[0]!.purchaseOption = { type: 'one-time' })), expect: ['invalid-field@lines[0].purchaseOption'] },
  { name: 'duplicate line ids', value: mutate(carts.mixed, (c) => (c.lines[1]!.id = 'l1')), expect: ['duplicate-id@lines[1].id'] },
];

export const invalidOrders: { name: string; value: Order; expect: string[] }[] = [
  { name: 'totals do not add up', value: mutate(orders.shipped, (o) => (o.totals.total.amount += 1)), expect: ['invalid-field@totals.total'] },
  { name: 'shippable order without an address', value: mutate(orders.shipped, (o) => delete o.shippingAddress), expect: ['missing-field@shippingAddress'] },
  { name: 'bad date', value: mutate(orders.shipped, (o) => (o.placedAt = 'yesterday')), expect: ['invalid-date@placedAt'] },
];

export type { Product };
