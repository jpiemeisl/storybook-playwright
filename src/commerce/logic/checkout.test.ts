import { describe, expect, it } from 'vitest';
import { carts, checkoutAddresses, checkoutValues, checkoutValuesForCart, confirmationOrders, DEMO_NOW, orderContext, products, promoDefinitions, shippingMethods, US_STATES, type CartFixtureKey } from '../fixtures';
import { computeCartTotals } from './cart';
import { getCartIssues, getCartLineNotes, getCartNotes, hasBlockingIssues, recurringText } from './cartLines';
import { billingAddressFor, canEnterStep, createOrderFromCart, firstInvalidStep, getCheckoutSteps, validateCheckoutStep, validateUsAddress } from './checkout';
import { validateCart, validateOrder } from './validate';

const ctx = { promoDefinitions, shippingMethods, now: DEMO_NOW };
const flagsOf = (key: CartFixtureKey) => computeCartTotals(carts[key], ctx).flags;
const keys = Object.keys(carts) as CartFixtureKey[];
const nonEmpty = keys.filter((k) => carts[k].lines.length > 0);
const byId = new Map(products.map((p) => [p.id, p]));

describe('getCartLineNotes', () => {
  const lineOf = (key: CartFixtureKey, id: string) => carts[key].lines.find((l) => l.id === id)!;

  it('describes renewals, trials and subscribe-and-save', () => {
    expect(getCartLineNotes(lineOf('subscriptionOnly', 'l1')).map((n) => n.text)).toEqual(['Renews every month']);
    expect(getCartLineNotes(lineOf('subscriptionOnly', 'l2')).map((n) => n.text)).toEqual(['Renews every 3 months']);
    expect(getCartLineNotes(lineOf('subscriptionTrial', 'l1')).map((n) => n.text)).toEqual(['Free for 14 days, then $6.00 / month']);
    // Coffee monthly, 15% off, quantity 2: notes mention the saving.
    expect(getCartLineNotes(lineOf('mixed', 'l2')).map((n) => n.kind)).toEqual(['renewal', 'savings']);
    expect(getCartLineNotes(lineOf('mixed', 'l2'))[1]!.text).toBe('Subscribe and save 15%');
  });

  it('marks digital lines as instant downloads and leaves one-time physical lines alone', () => {
    expect(getCartLineNotes(lineOf('digitalOnly', 'l1'), { product: byId.get('prod-guide') })).toEqual([{ kind: 'download', text: 'Instant download' }]);
    expect(getCartLineNotes(lineOf('physicalOnly', 'l1'))).toEqual([]);
  });

  it('says a backordered or pre-ordered line ships separately only next to other shippable lines', () => {
    const kettle = lineOf('subscriptionTrial', 'l2');
    expect(getCartLineNotes(kettle, { product: byId.get('prod-kettle'), otherShippableLines: true })[0]!.text).toMatch(/^Ships separately from /);
    expect(getCartLineNotes(kettle, { product: byId.get('prod-kettle'), otherShippableLines: false })).toEqual([]);
    expect(getCartNotes(carts.subscriptionTrial, products).l2!.map((n) => n.kind)).toEqual(['ships-separately']);
  });

  it('formats recurring text for the "Then billed" list', () => {
    expect(recurringText({ amount: 900, currency: 'USD' }, { unit: 'month', count: 1 }, '2026-12-05')).toBe('$9.00 every month starting Dec 5, 2026');
    expect(recurringText({ amount: 5400, currency: 'USD' }, { unit: 'month', count: 3 })).toBe('$54.00 every 3 months');
  });
});

describe('getCartIssues', () => {
  it('finds out-of-stock lines', () => {
    const issues = getCartIssues(carts.withOutOfStockLine, products);
    expect(issues).toEqual([expect.objectContaining({ lineId: 'l2', kind: 'out-of-stock', title: 'Brass desk lamp', blocking: true })]);
    expect(hasBlockingIssues(issues)).toBe(true);
  });

  it('finds quantities above stock with the available amount', () => {
    expect(getCartIssues(carts.quantityAboveStock, products)).toEqual([expect.objectContaining({ lineId: 'l1', kind: 'quantity-above-stock', available: 3, message: 'Only 3 left. Reduce the quantity to continue.' })]);
  });

  it('finds products and variants that no longer exist', () => {
    const issues = getCartIssues(carts.physicalOnly, products.filter((p) => p.id !== 'prod-mug'));
    expect(issues.map((i) => [i.lineId, i.kind])).toEqual([['l1', 'unavailable']]);
  });

  it('treats backorder and pre-order as purchasable', () => {
    expect(getCartIssues(carts.subscriptionTrial, products)).toEqual([]);
    expect(getCartIssues(carts.withPromo, products)).toEqual([]);
  });

  it('reports nothing for the clean fixtures', () => {
    for (const key of ['empty', 'physicalOnly', 'digitalOnly', 'subscriptionOnly', 'mixed', 'twentyLines', 'oneLine', 'freeShippingAt', 'multipleIntervals', 'longTitles'] as const) {
      expect(getCartIssues(carts[key], products), key).toEqual([]);
    }
  });
});

describe('getCheckoutSteps', () => {
  const expected: Record<CartFixtureKey, string> = {
    empty: 'information payment review',
    physicalOnly: 'information shipping payment review',
    digitalOnly: 'information payment review',
    subscriptionOnly: 'information payment review',
    mixed: 'information shipping payment review',
    twentyLines: 'information shipping payment review',
    withPromo: 'information shipping payment review',
    withOutOfStockLine: 'information shipping payment review',
    subscriptionTrial: 'information shipping payment review',
    oneLine: 'information shipping payment review',
    quantityAboveStock: 'information shipping payment review',
    freeShippingBelow: 'information shipping payment review',
    freeShippingAt: 'information shipping payment review',
    subscriptionWithTrial: 'information payment review',
    multipleIntervals: 'information shipping payment review',
    longTitles: 'information shipping payment review',
  };
  it.each(keys)('%s', (key) => {
    expect(getCheckoutSteps(flagsOf(key)).join(' ')).toBe(expected[key]);
  });
});

describe('validateCheckoutStep', () => {
  const physical = flagsOf('physicalOnly');
  const digital = flagsOf('digitalOnly');
  const subscription = flagsOf('subscriptionOnly');
  const mixed = flagsOf('mixed');

  it('passes every step for valid values of each kind', () => {
    for (const key of nonEmpty) {
      const flags = flagsOf(key);
      const values = checkoutValuesForCart(key);
      for (const step of getCheckoutSteps(flags)) expect(validateCheckoutStep(step, values, flags), `${key} ${step}`).toEqual({});
    }
    expect(firstInvalidStep(checkoutValues.mixed, mixed)).toBeNull();
  });

  it('information: email format and required US address fields, in form order', () => {
    expect(validateCheckoutStep('information', checkoutValues.invalidInformation, physical)).toEqual({
      email: 'Enter an email address in the correct format, like name@example.com',
      'shippingAddress.line1': 'Enter a street address',
      'shippingAddress.city': 'Enter a city',
      'shippingAddress.postalCode': 'Enter a ZIP code like 97201 or 97201-1234',
    });
    expect(validateCheckoutStep('information', checkoutValues.empty, physical)).toMatchObject({ email: 'Enter your email address', 'shippingAddress.name': 'Enter a full name', 'shippingAddress.region': 'Choose a state' });
  });

  it('information for digital-only carts asks for a billing address instead of a shipping address', () => {
    const errors = validateCheckoutStep('information', checkoutValues.invalidDigitalBilling, digital);
    expect(Object.keys(errors)).toEqual(['billingAddress.name', 'billingAddress.line1', 'billingAddress.city', 'billingAddress.region', 'billingAddress.postalCode']);
    expect(Object.keys(errors).some((k) => k.startsWith('shippingAddress'))).toBe(false);
    // Hosts whose provider collects billing details can turn it off.
    expect(validateCheckoutStep('information', checkoutValues.invalidDigitalBilling, digital, { collectBillingAddress: false })).toEqual({});
  });

  it('accepts ZIP+4, rejects unknown states and bad phones', () => {
    expect(validateUsAddress(checkoutAddresses.zipPlus4, 'shippingAddress')).toEqual({});
    expect(validateUsAddress(checkoutAddresses.longNames, 'shippingAddress')).toEqual({});
    expect(validateUsAddress({ ...checkoutAddresses.home, region: 'ZZ', phone: 'call me' }, 'billingAddress')).toEqual({
      'billingAddress.region': 'Choose a state from the list',
      'billingAddress.phone': 'Enter a phone number, like 503 555 0142',
    });
  });

  it('shipping: a method is required only when the cart ships', () => {
    expect(validateCheckoutStep('shipping', checkoutValues.invalidShipping, physical)).toEqual({ shippingMethodId: 'Choose a shipping method' });
    expect(validateCheckoutStep('shipping', checkoutValues.invalidShipping, digital)).toEqual({});
  });

  it('payment: method, terms, billing address when different, subscription terms when relevant', () => {
    expect(validateCheckoutStep('payment', checkoutValues.invalidPayment, physical)).toEqual({
      paymentMethod: 'Choose a payment method',
      'billingAddress.name': 'Enter a full name',
      'billingAddress.line1': 'Enter a street address',
      'billingAddress.city': 'Enter a city',
      'billingAddress.region': 'Choose a state',
      'billingAddress.postalCode': 'Enter a ZIP code',
      termsAccepted: 'Accept the terms of sale to continue',
    });
    const noSubTerms = { ...checkoutValues.subscription, subscriptionTermsAccepted: false };
    expect(validateCheckoutStep('payment', noSubTerms, subscription)).toEqual({ subscriptionTermsAccepted: 'Confirm you understand how renewal and cancellation work' });
    expect(validateCheckoutStep('payment', { ...checkoutValues.physical, subscriptionTermsAccepted: false }, physical)).toEqual({});
  });

  it('review has no fields of its own', () => {
    expect(validateCheckoutStep('review', checkoutValues.empty, mixed)).toEqual({});
  });

  it('billingAddressFor: shipping address when same, billing address otherwise', () => {
    expect(billingAddressFor(checkoutValues.physical, physical)).toBe(checkoutAddresses.home);
    expect(billingAddressFor(checkoutValues.mixed, mixed)).toBe(checkoutAddresses.zipPlus4);
    expect(billingAddressFor(checkoutValues.digital, digital)).toBe(checkoutAddresses.apartment);
  });
});

describe('canEnterStep', () => {
  const physical = flagsOf('physicalOnly');
  const digital = flagsOf('digitalOnly');

  it('allows the first step and blocks steps after a failing one', () => {
    expect(canEnterStep('information', checkoutValues.empty, physical)).toBe(true);
    expect(canEnterStep('shipping', checkoutValues.empty, physical)).toBe(false);
    expect(canEnterStep('shipping', checkoutValues.invalidShipping, physical)).toBe(true);
    expect(canEnterStep('payment', checkoutValues.invalidShipping, physical)).toBe(false);
    expect(canEnterStep('review', checkoutValues.physical, physical)).toBe(true);
  });

  it('digital-only carts go from information straight to payment and cannot enter shipping', () => {
    expect(canEnterStep('payment', checkoutValues.digital, digital)).toBe(true);
    expect(canEnterStep('shipping', checkoutValues.digital, digital)).toBe(false);
    expect(firstInvalidStep(checkoutValues.invalidDigitalBilling, digital)?.step).toBe('information');
  });
});

describe('createOrderFromCart', () => {
  it('physical: shipping address and chosen method, no downloads or recurring', () => {
    const order = confirmationOrders.physical;
    expect(order).toMatchObject({ id: 'ord-2026-2001', number: 'FH-2001', placedAt: DEMO_NOW, status: 'processing', email: 'robin@example.com' });
    expect(order.shippingAddress).toEqual(checkoutAddresses.home);
    expect(order.billingAddress).toEqual(checkoutAddresses.home);
    expect(order.shippingMethod?.id).toBe('ship-standard');
    expect(order.downloads).toBeUndefined();
    expect(order.recurring).toBeUndefined();
    expect(order.totals.dueToday).toBeUndefined();
  });

  it('digital: one available download per file with format, size and expiry from accessDays', () => {
    const order = confirmationOrders.digital;
    expect(order.shippingAddress).toBeUndefined();
    expect(order.billingAddress).toEqual(checkoutAddresses.apartment);
    expect(order.downloads?.every((d) => d.available)).toBe(true);
    expect(order.downloads?.find((d) => d.fileId === 'guide-pdf')).toEqual({ fileId: 'guide-pdf', name: 'small-garden-guide.pdf', available: true, format: 'PDF', sizeBytes: 18_400_000, productId: 'prod-guide' });
    expect(order.downloads?.filter((d) => d.expiresAt).every((d) => d.expiresAt === '2027-03-21')).toBe(true);
  });

  it('subscription with trial: first billing at trial end and a lower amount charged today', () => {
    const order = confirmationOrders.subscriptionTrial;
    expect(order.recurring).toEqual([
      { lineId: 'l1', amount: { amount: 600, currency: 'USD' }, interval: { unit: 'month', count: 1 }, firstBillingAt: '2026-04-04', trialEndsAt: '2026-04-04', note: 'Free until Apr 4, 2026, then $6.00 / month' },
      { lineId: 'l2', amount: { amount: 1800, currency: 'USD' }, interval: { unit: 'month', count: 1 }, firstBillingAt: '2026-04-21', note: '$18.00 / month, next charge Apr 21, 2026' },
    ]);
    expect(order.totals.dueToday!.amount).toBeLessThan(order.totals.total.amount);
  });

  it('mixed: shipping, downloads and recurring together, with a separate billing address', () => {
    const order = confirmationOrders.mixed;
    expect(order.shippingAddress).toEqual(checkoutAddresses.home);
    expect(order.billingAddress).toEqual(checkoutAddresses.zipPlus4);
    expect(order.downloads?.map((d) => d.fileId)).toEqual(['guide-pdf']);
    expect(order.recurring?.map((r) => r.lineId)).toEqual(['l2', 'l4']);
  });

  it('uses the values’ shipping method for totals and never reads the clock', () => {
    const a = createOrderFromCart(carts.physicalOnly, { ...checkoutValues.physical, shippingMethodId: 'ship-express' }, orderContext(1));
    const b = createOrderFromCart(carts.physicalOnly, { ...checkoutValues.physical, shippingMethodId: 'ship-express' }, orderContext(1));
    expect(a).toEqual(b);
    expect(a.shippingMethod?.id).toBe('ship-express');
    expect(a.totals.shipping.amount).toBe(1495);
  });
});

describe('contract: every cart fixture makes a valid order whose totals match computeCartTotals', () => {
  it.each(nonEmpty)('%s', (key) => {
    const cart = carts[key];
    const values = checkoutValuesForCart(key);
    const order = createOrderFromCart(cart, values, orderContext(9000));
    expect(validateCart(cart)).toEqual([]);
    expect(validateOrder(order)).toEqual([]);
    const totals = computeCartTotals(values.shippingMethodId ? { ...cart, shippingMethodId: values.shippingMethodId } : cart, { ...ctx, now: order.placedAt });
    expect(order.totals).toEqual({
      subtotal: totals.subtotal,
      discount: totals.discount,
      shipping: totals.shipping,
      tax: totals.tax,
      total: totals.total,
      ...(totals.dueToday.amount !== totals.total.amount ? { dueToday: totals.dueToday } : {}),
    });
    expect(JSON.parse(JSON.stringify(order))).toEqual(order);
  });

  it('confirmation orders validate and round-trip', () => {
    for (const [name, order] of Object.entries(confirmationOrders)) {
      expect(validateOrder(order), name).toEqual([]);
      expect(JSON.parse(JSON.stringify(order)), name).toEqual(order);
    }
  });

  it('checkout values round-trip and the states list has 50 states plus DC', () => {
    for (const values of Object.values(checkoutValues)) expect(JSON.parse(JSON.stringify(values))).toEqual(values);
    expect(US_STATES).toHaveLength(51);
    expect(new Set(US_STATES.map((s) => s.code)).size).toBe(51);
  });
});
