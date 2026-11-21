import { describe, expect, it } from 'vitest';
import type { Cart, CustomerSubscription, Order, Product } from '../types';
import { validateCart, validateCatalog, validateCustomerSubscription, validateOrder, validateProduct } from './validate';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const product = (): Product => ({
  id: 'tee',
  handle: 'field-tee',
  kind: 'physical',
  title: 'Field tee',
  description: { format: 'html', html: '<p>Soft cotton.</p>' },
  images: [{ src: '/a.svg', alt: 'A tee' }],
  options: [{ name: 'Size', values: ['S', 'M'] }],
  variants: [
    { id: 's', title: 'S', optionValues: { Size: 'S' }, price: usd(2500), stock: { status: 'in-stock' } },
    { id: 'm', title: 'M', optionValues: { Size: 'M' }, price: usd(2500), compareAtPrice: usd(3000), stock: { status: 'low-stock', quantity: 3 }, imageIndex: 0 },
  ],
  purchaseOptions: [{ type: 'one-time' }, { type: 'subscription', interval: { unit: 'month', count: 1 }, discountPercent: 10 }],
});
const codes = (issues: { code: string; path: string }[]) => issues.map((issue) => `${issue.code}@${issue.path}`);

describe('validateProduct', () => {
  it('accepts a valid product', () => {
    expect(validateProduct(product())).toEqual([]);
  });

  it('requires fields and integer money in one currency', () => {
    const p = product() as unknown as Record<string, unknown>;
    delete p.title;
    const variants = p.variants as Record<string, unknown>[];
    variants[0]!.price = { amount: 25.5, currency: 'USD' };
    variants[1]!.price = usd(2500);
    variants[1]!.compareAtPrice = { amount: 3000, currency: 'EUR' };
    expect(codes(validateProduct(p))).toEqual(expect.arrayContaining(['missing-field@title', 'invalid-field@variants[0].price.amount', 'invalid-field@variants[1].compareAtPrice.currency']));
  });

  it('checks variants against the declared options', () => {
    const p = product();
    p.variants[0]!.optionValues = { Size: 'XL', Colour: 'Moss' };
    p.variants[1]!.optionValues = {};
    expect(codes(validateProduct(p))).toEqual(expect.arrayContaining(['invalid-field@variants[0].optionValues.Size', 'invalid-field@variants[0].optionValues.Colour', 'missing-field@variants[1].optionValues.Size']));
  });

  it('enforces purchase option rules', () => {
    const sub = { ...product(), kind: 'subscription' as const, subscription: { cancelAnytime: true } };
    expect(codes(validateProduct(sub))).toContain('invalid-field@purchaseOptions');
    const missingTerms = { ...product(), kind: 'subscription' as const, purchaseOptions: [{ type: 'subscription' as const, interval: { unit: 'month' as const, count: 0 } }] };
    expect(codes(validateProduct(missingTerms))).toEqual(expect.arrayContaining(['missing-field@subscription', 'invalid-field@purchaseOptions[0].interval.count']));
    expect(codes(validateProduct({ ...product(), purchaseOptions: [] }))).toContain('too-few@purchaseOptions');
  });

  it('requires digital delivery for digital products', () => {
    expect(codes(validateProduct({ ...product(), kind: 'digital', purchaseOptions: [{ type: 'one-time' }] }))).toContain('missing-field@digital');
  });

  it('reports duplicates, bad compare-at prices, unsafe images and out-of-range image indexes', () => {
    const p = product();
    p.variants[1]!.id = 's';
    p.variants[1]!.optionValues = { Size: 'S' };
    p.variants[1]!.compareAtPrice = usd(2000);
    p.variants[1]!.imageIndex = 4;
    p.images.push({ src: 'javascript:alert(1)', alt: '' });
    expect(codes(validateProduct(p))).toEqual(
      expect.arrayContaining(['duplicate-id@variants[1].id', 'duplicate-id@variants[1].optionValues', 'invalid-field@variants[1].compareAtPrice', 'invalid-field@variants[1].imageIndex', 'unsafe-src@images[1].src']),
    );
  });

  it('pre-orders need an ISO release date', () => {
    const p = product();
    p.variants[0]!.stock = { status: 'preorder', availableOn: '01/06/2026' };
    expect(codes(validateProduct(p))).toContain('invalid-date@variants[0].stock.availableOn');
  });
});

const cart = (): Cart => ({
  id: 'c',
  currency: 'USD',
  promoCodes: [],
  lines: [{ id: 'l1', productId: 'tee', variantId: 's', quantity: 1, purchaseOption: { type: 'one-time' }, snapshot: { title: 'Field tee', unitPrice: usd(2500), kind: 'physical', requiresShipping: true } }],
});

describe('validateCart', () => {
  it('accepts a valid cart', () => expect(validateCart(cart())).toEqual([]));

  it('requires quantity >= 1, the cart currency and subscription options for subscription products', () => {
    const c = cart();
    c.lines.push({ ...c.lines[0]!, id: 'l1', quantity: 0, snapshot: { ...c.lines[0]!.snapshot, kind: 'subscription', requiresShipping: false, unitPrice: { amount: 900, currency: 'EUR' } } });
    expect(codes(validateCart(c))).toEqual(
      expect.arrayContaining(['invalid-field@lines[1].quantity', 'invalid-field@lines[1].snapshot.unitPrice.currency', 'invalid-field@lines[1].purchaseOption', 'duplicate-id@lines[1].id']),
    );
  });
});

describe('validateOrder and validateCustomerSubscription', () => {
  const order = (): Order => ({
    id: 'o1',
    number: 'BW-1001',
    placedAt: '2026-03-01T10:00:00Z',
    status: 'shipped',
    lines: cart().lines,
    totals: { subtotal: usd(2500), discount: usd(0), shipping: usd(595), tax: usd(248), total: usd(3343) },
    shippingAddress: { name: 'Robin Vale', line1: '1 Elm Row', city: 'Portland', postalCode: '97201', country: 'US' },
  });

  it('accepts a valid order and checks that totals add up and a shippable order has an address', () => {
    expect(validateOrder(order())).toEqual([]);
    const o = order() as unknown as Record<string, unknown>;
    delete o.shippingAddress;
    (o.totals as Record<string, unknown>).total = usd(1);
    expect(codes(validateOrder(o))).toEqual(expect.arrayContaining(['missing-field@shippingAddress', 'invalid-field@totals.total']));
  });

  it('checks subscription dates by status', () => {
    const sub: CustomerSubscription = { id: 's', productTitle: 'Bean club', plan: 'Monthly', price: usd(1800), interval: { unit: 'month', count: 1 }, status: 'trialing', startedAt: '2026-03-01', nextBillingAt: '2026-03-15' };
    expect(codes(validateCustomerSubscription(sub))).toEqual(['missing-field@trialEndsAt']);
  });

  it('catalogue: product issues are prefixed and collections must reference products', () => {
    const issues = validateCatalog({ products: [product(), { ...product(), title: '' }], collections: [{ id: 'all', handle: 'all', title: 'All', productIds: ['tee', 'ghost'] }] });
    expect(codes(issues)).toEqual(expect.arrayContaining(['missing-field@products[1].title', 'duplicate-id@products[1].id', 'invalid-field@collections[0].productIds[1]']));
  });
});
