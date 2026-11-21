/*
 * Runtime validation for commerce data, reusing the core ValidationIssue shape and Checker. Pure.
 * Codes used: missing-field, invalid-field (including currency mismatches and rule violations),
 * duplicate-id, unsafe-src, missing-alt, invalid-date, too-few.
 */
import { Checker, isObj, type ValidationIssue } from '../../registry/checker';

const STOCK = ['in-stock', 'low-stock', 'out-of-stock', 'backorder', 'preorder'] as const;
const KINDS = ['physical', 'digital', 'subscription'] as const;
const UNITS = ['week', 'month', 'year'] as const;
const ORDER_STATUS = ['processing', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
const SUB_STATUS = ['trialing', 'active', 'past-due', 'paused', 'cancelled'] as const;
const INVOICE_STATUS = ['paid', 'open', 'failed', 'refunded'] as const;

/** Deliberately simple: something@something.tld, no spaces. Real checks happen when mail is sent. */
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const isInt = (value: unknown, min = -Infinity) => typeof value === 'number' && Number.isSafeInteger(value) && value >= min;

/** Money: integer minor units (>= 0 unless negative is allowed) and a 3-letter currency, matching `currency` when given. */
function moneyField(c: Checker, key: string, required: boolean, currency?: string) {
  c.child(key, required, (m) => {
    if (!isInt(m.value.amount, 0)) m.report('invalid-field', 'amount', '"amount" must be a whole number of minor units (cents), 0 or more.');
    if (typeof m.value.currency !== 'string' || !/^[A-Z]{3}$/.test(m.value.currency)) m.report('invalid-field', 'currency', '"currency" must be an ISO 4217 code such as "USD".');
    else if (currency && m.value.currency !== currency) m.report('invalid-field', 'currency', `Currency ${m.value.currency} does not match ${currency}.`);
  });
}

function intField(c: Checker, key: string, min: number, required = false) {
  const value = c.value[key];
  if (value === undefined) {
    if (required) c.report('missing-field', key, `"${key}" is required.`);
  } else if (!isInt(value, min)) c.report('invalid-field', key, `"${key}" must be a whole number of at least ${min}.`);
}

function purchaseOption(c: Checker) {
  c.oneOf('type', ['one-time', 'subscription']);
  if (c.value.type !== 'subscription') return;
  c.child('interval', true, (i) => {
    i.oneOf('unit', UNITS);
    intField(i, 'count', 1, true);
  });
  const discount = c.value.discountPercent;
  if (discount !== undefined && (typeof discount !== 'number' || discount < 0 || discount > 100)) c.report('invalid-field', 'discountPercent', '"discountPercent" must be between 0 and 100.');
  intField(c, 'trialDays', 0);
  intField(c, 'priceMultiplier', 1);
}

/** Item ids must be unique in a list. */
function uniqueIds(c: Checker, key: string, field = 'id') {
  const list = c.value[key];
  if (!Array.isArray(list)) return;
  const seen = new Set<unknown>();
  list.forEach((item, i) => {
    if (!isObj(item) || item[field] === undefined) return;
    if (seen.has(item[field])) c.report('duplicate-id', `${key}[${i}].${field}`, `${field} ${JSON.stringify(item[field])} is used more than once.`);
    seen.add(item[field]);
  });
}

const run = (target: unknown, check: (c: Checker) => void): ValidationIssue[] => {
  const issues: ValidationIssue[] = [];
  if (!isObj(target)) return [{ code: 'invalid-field', severity: 'error', message: 'Expected an object.', path: '' }];
  check(new Checker(target, '', issues, {}));
  return issues;
};

/** Product: required fields, options and variants, money and currency, stock, purchase option rules, digital and subscription details. */
export function validateProduct(product: unknown): ValidationIssue[] {
  return run(product, (c) => {
    c.str('id');
    c.str('handle');
    if (typeof c.value.handle === 'string' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(c.value.handle)) c.report('invalid-field', 'handle', '"handle" must be lowercase letters, digits and single hyphens.');
    c.oneOf('kind', KINDS);
    c.str('title');
    c.str('summary', false);
    c.richText('description');
    c.strings('tags');
    c.strings('badges');
    c.each('images', 0, 20, (img) => {
      img.str('src');
      imageSrc(img);
      if (typeof img.value.alt !== 'string') img.report('missing-alt', 'alt', 'Image alt text is required (use "" only for decorative images).');
    });

    const options = Array.isArray(c.value.options) ? (c.value.options as { name?: unknown; values?: unknown }[]) : [];
    c.each('options', 0, 4, (o) => {
      o.str('name');
      o.strings('values', true);
      o.oneOf('display', ['buttons', 'swatches', 'select']);
      o.child('swatches', false, (sw) => {
        for (const [value, colour] of Object.entries(sw.value)) {
          if (!Array.isArray(o.value.values) || !o.value.values.includes(value)) sw.report('invalid-field', value, `Swatch for ${JSON.stringify(value)}, which is not a value of this option.`);
          if (typeof colour !== 'string' || !/^(#[0-9a-f]{3,8}|rgb\(|hsl\(|oklch\()/i.test(colour)) sw.report('invalid-field', value, 'Swatch colours must be hex, rgb(), hsl() or oklch() values.');
        }
      });
      const values = o.value.values;
      if (Array.isArray(values) && values.length === 0) o.report('too-few', 'values', 'An option needs at least one value.');
      if (Array.isArray(values) && new Set(values).size !== values.length) o.report('duplicate-id', 'values', 'Option values must be unique.');
    });
    uniqueIds(c, 'options', 'name');

    const images = Array.isArray(c.value.images) ? c.value.images.length : 0;
    const currencies = new Set<string>();
    c.each('variants', 1, 100, (v) => {
      v.str('id');
      v.str('sku', false);
      v.str('title');
      v.child('optionValues', true, (ov) => {
        const keys = Object.keys(ov.value);
        for (const option of options) {
          const value = ov.value[String(option.name)];
          if (value === undefined) ov.report('missing-field', String(option.name), `A value for option "${String(option.name)}" is required.`);
          else if (!Array.isArray(option.values) || !option.values.includes(value)) ov.report('invalid-field', String(option.name), `${JSON.stringify(value)} is not a declared value of "${String(option.name)}".`);
        }
        for (const key of keys) if (!options.some((o) => o.name === key)) ov.report('invalid-field', key, `"${key}" is not a declared option.`);
      });
      const currency = isObj(v.value.price) && typeof v.value.price.currency === 'string' ? v.value.price.currency : undefined;
      if (currency) currencies.add(currency);
      moneyField(v, 'price', true);
      moneyField(v, 'compareAtPrice', false, currency);
      const price = v.value.price as { amount?: number } | undefined;
      const compare = v.value.compareAtPrice as { amount?: number } | undefined;
      if (compare && price && typeof compare.amount === 'number' && typeof price.amount === 'number' && compare.amount <= price.amount) {
        v.report('invalid-field', 'compareAtPrice', '"compareAtPrice" must be higher than "price" (it is the original price of a sale).');
      }
      v.child('stock', true, (s) => {
        s.oneOf('status', STOCK);
        intField(s, 'quantity', 0);
        s.date('availableOn', s.value.status === 'preorder');
      });
      const index = v.value.imageIndex;
      if (index !== undefined && (!isInt(index, 0) || (index as number) >= images)) v.report('invalid-field', 'imageIndex', `"imageIndex" must point at one of the ${images} image(s).`);
      intField(v, 'weight', 1);
    });
    if (currencies.size > 1) c.report('invalid-field', 'variants', `All variants must use one currency; found ${[...currencies].join(', ')}.`);
    uniqueIds(c, 'variants');
    uniqueIds(c, 'variants', 'sku');
    if (Array.isArray(c.value.variants)) {
      const combos = new Set<string>();
      c.value.variants.forEach((variant, i) => {
        if (!isObj(variant) || !isObj(variant.optionValues)) return;
        const key = JSON.stringify(Object.entries(variant.optionValues).sort());
        if (combos.has(key)) c.report('duplicate-id', `variants[${i}].optionValues`, 'Two variants have the same option values.');
        combos.add(key);
      });
    }

    c.each('purchaseOptions', 1, 6, purchaseOption);
    const types = Array.isArray(c.value.purchaseOptions) ? c.value.purchaseOptions.map((o) => (isObj(o) ? o.type : undefined)) : [];
    if (c.value.kind === 'subscription' && types.includes('one-time')) c.report('invalid-field', 'purchaseOptions', 'Subscription products offer only subscription purchase options.');
    if (c.value.kind === 'digital' && types.includes('subscription')) c.report('invalid-field', 'purchaseOptions', 'Digital products are sold as one-time purchases.');
    if (types.filter((t) => t === 'one-time').length > 1) c.report('duplicate-id', 'purchaseOptions', 'Only one one-time purchase option is allowed.');

    c.child('digital', c.value.kind === 'digital', (d) => {
      if (c.value.kind !== 'digital') c.report('invalid-field', 'digital', '"digital" is only for digital products.');
      d.each('files', 1, 50, (f) => {
        f.str('id');
        f.str('name');
        f.str('format');
        intField(f, 'sizeBytes', 0, true);
      });
      uniqueIds(d, 'files');
      if (typeof d.value.instant !== 'boolean') d.report('missing-field', 'instant', '"instant" is required (true or false).');
      d.child('licence', false, (l) => {
        l.oneOf('type', ['single', 'team', 'unlimited']);
        l.str('summary');
      });
      intField(d, 'accessDays', 1);
    });
    c.child('subscription', c.value.kind === 'subscription', (s) => {
      if (typeof s.value.cancelAnytime !== 'boolean') s.report('missing-field', 'cancelAnytime', '"cancelAnytime" is required (true or false).');
      intField(s, 'minimumTermMonths', 1);
    });
    c.child('rating', false, (r) => {
      const average = r.value.average;
      if (typeof average !== 'number' || average < 0 || average > 5) r.report('invalid-field', 'average', '"average" must be between 0 and 5.');
      intField(r, 'count', 0, true);
    });
    c.child('seo', false, (s) => s.str('title'));
    c.each('infoSections', 0, 12, (s) => {
      s.str('id');
      s.str('title');
      s.richText('content');
    });
    uniqueIds(c, 'infoSections');
    c.child('sizeGuide', false, (t) => {
      t.str('caption');
      t.each('columns', 1, 16, (col) => {
        col.str('key');
        col.str('header');
      });
      t.each('rows', 1, 100, () => {});
    });
    c.date('createdAt', false);
  });
}

/** Reviews data: summary numbers that add up, ratings 1-5, unique ids, ISO dates. */
export function validateReviewsData(data: unknown): ValidationIssue[] {
  return run(data, (c) => {
    c.child('summary', true, (s) => {
      const average = s.value.average;
      if (typeof average !== 'number' || average < 0 || average > 5) s.report('invalid-field', 'average', '"average" must be between 0 and 5.');
      intField(s, 'count', 0, true);
      s.child('distribution', true, (d) => {
        let total = 0;
        for (const star of ['1', '2', '3', '4', '5']) {
          if (!isInt(d.value[star], 0)) d.report('invalid-field', star, `Count for ${star} stars must be a whole number.`);
          else total += d.value[star] as number;
        }
        if (isInt(s.value.count, 0) && total !== s.value.count) s.report('invalid-field', 'distribution', `Distribution adds up to ${total}, not ${String(s.value.count)}.`);
      });
    });
    c.each('reviews', 0, 500, (r) => {
      r.str('id');
      r.str('author');
      intField(r, 'rating', 1, true);
      if (isInt(r.value.rating, 1) && (r.value.rating as number) > 5) r.report('invalid-field', 'rating', '"rating" must be 1-5.');
      r.str('body');
      r.date('createdAt');
    });
    uniqueIds(c, 'reviews');
  });
}

/** Image src must be relative or http(s) (Checker.image on the item itself). */
function imageSrc(img: Checker) {
  const src = img.value.src;
  if (typeof src === 'string' && /^\s*[a-z][a-z0-9+.-]*:/i.test(src) && !/^\s*https?:/i.test(src)) img.report('unsafe-src', 'src', `Unsafe image source ${JSON.stringify(src)}.`);
}

function cartLine(l: Checker, currency: unknown) {
  l.str('id');
  l.str('productId');
  l.str('variantId');
  intField(l, 'quantity', 1, true);
  l.child('purchaseOption', true, purchaseOption);
  l.child('snapshot', true, (s) => {
    s.str('title');
    s.str('variantTitle', false);
    s.child('image', false, (img) => {
      img.str('src');
      imageSrc(img);
    });
    moneyField(s, 'unitPrice', true, typeof currency === 'string' ? currency : undefined);
    moneyField(s, 'compareAtPrice', false, typeof currency === 'string' ? currency : undefined);
    s.oneOf('kind', KINDS);
    if (typeof s.value.requiresShipping !== 'boolean') s.report('missing-field', 'requiresShipping', '"requiresShipping" is required (true or false).');
    if (s.value.kind !== 'physical' && s.value.requiresShipping === true) s.report('invalid-field', 'requiresShipping', 'Only physical products require shipping.');
  });
  const option = l.value.purchaseOption;
  if (isObj(l.value.snapshot) && l.value.snapshot.kind === 'subscription' && isObj(option) && option.type !== 'subscription') {
    l.report('invalid-field', 'purchaseOption', 'A subscription product line must use a subscription purchase option.');
  }
}

/** Cart: currency, lines (quantity >= 1, money in the cart currency, purchase options), promo codes. */
export function validateCart(cart: unknown): ValidationIssue[] {
  return run(cart, (c) => {
    c.str('id');
    if (typeof c.value.currency !== 'string' || !/^[A-Z]{3}$/.test(c.value.currency)) c.report('invalid-field', 'currency', '"currency" must be an ISO 4217 code such as "USD".');
    c.each('lines', 0, 100, (l) => cartLine(l, c.value.currency));
    uniqueIds(c, 'lines');
    c.strings('promoCodes', true);
    c.str('shippingMethodId', false);
  });
}

function address(c: Checker, key: string, required: boolean) {
  c.child(key, required, (a) => {
    a.str('name');
    a.str('line1');
    a.str('city');
    a.str('postalCode');
    if (typeof a.value.country !== 'string' || !/^[A-Z]{2}$/.test(a.value.country)) a.report('invalid-field', 'country', '"country" must be an ISO 3166-1 alpha-2 code such as "US".');
  });
}

/** Order: required fields, status, lines, totals that add up in one currency, addresses, tracking and download dates. */
export function validateOrder(order: unknown): ValidationIssue[] {
  return run(order, (c) => {
    c.str('id');
    c.str('number');
    c.date('placedAt');
    c.oneOf('status', ORDER_STATUS);
    const totals = isObj(c.value.totals) ? c.value.totals : undefined;
    const currency = totals && isObj(totals.total) && typeof totals.total.currency === 'string' ? totals.total.currency : undefined;
    c.each('lines', 1, 100, (l) => cartLine(l, currency));
    uniqueIds(c, 'lines');
    c.child('totals', true, (t) => {
      for (const key of ['subtotal', 'discount', 'shipping', 'tax', 'total']) moneyField(t, key, true, currency);
      const amount = (key: string) => (isObj(t.value[key]) ? Number((t.value[key] as { amount: unknown }).amount) : NaN);
      const expected = amount('subtotal') - amount('discount') + amount('shipping') + amount('tax');
      if (Number.isFinite(expected) && expected !== amount('total')) t.report('invalid-field', 'total', `"total" should be subtotal - discount + shipping + tax (${expected}).`);
      moneyField(t, 'dueToday', false, currency);
      if (amount('dueToday') > amount('total')) t.report('invalid-field', 'dueToday', '"dueToday" cannot be more than "total".');
    });
    c.str('email', false);
    if (typeof c.value.email === 'string' && !EMAIL.test(c.value.email)) c.report('invalid-field', 'email', '"email" must be an email address.');
    const lineIds = new Set(Array.isArray(c.value.lines) ? c.value.lines.map((l) => (isObj(l) ? l.id : undefined)) : []);
    c.each('recurring', 0, 100, (r) => {
      if (!lineIds.has(r.value.lineId)) r.report('invalid-field', 'lineId', `"lineId" ${JSON.stringify(r.value.lineId)} is not a line in this order.`);
      moneyField(r, 'amount', true, currency);
      r.child('interval', true, (i) => {
        i.oneOf('unit', UNITS);
        intField(i, 'count', 1, true);
      });
      r.date('firstBillingAt');
      r.date('trialEndsAt', false);
      r.str('note');
    });
    const shippable = Array.isArray(c.value.lines) && c.value.lines.some((l) => isObj(l) && isObj(l.snapshot) && l.snapshot.requiresShipping === true);
    address(c, 'shippingAddress', shippable);
    address(c, 'billingAddress', false);
    c.child('shippingMethod', false, (m) => {
      m.str('id');
      m.str('label');
      moneyField(m, 'price', true, currency);
    });
    c.child('tracking', false, (t) => {
      t.str('carrier');
      t.str('number');
      t.each('events', 0, 50, (e) => {
        e.date('at');
        e.str('label');
      });
    });
    c.each('downloads', 0, 50, (d) => {
      d.str('fileId');
      d.str('name');
      if (typeof d.value.available !== 'boolean') d.report('missing-field', 'available', '"available" is required (true or false).');
      d.date('expiresAt', false);
      d.str('format', false);
      intField(d, 'sizeBytes', 0);
      d.str('reason', false);
    });
  });
}

/** Customer subscription: status, price, interval and the dates each status needs. */
export function validateCustomerSubscription(subscription: unknown): ValidationIssue[] {
  return run(subscription, (c) => {
    c.str('id');
    c.str('productTitle');
    c.str('plan');
    moneyField(c, 'price', true);
    c.child('interval', true, (i) => {
      i.oneOf('unit', UNITS);
      intField(i, 'count', 1, true);
    });
    c.oneOf('status', SUB_STATUS);
    c.date('startedAt');
    c.date('nextBillingAt', c.value.status !== 'cancelled' && !(c.value.status === 'paused' && c.value.pauseOpenEnded === true));
    c.date('trialEndsAt', c.value.status === 'trialing');
    c.date('cancelledAt', c.value.status === 'cancelled');
    c.str('productId', false);
    c.date('pausedUntil', false);
    c.date('currentPeriodEnd', !!c.value.cancelAtPeriodEnd);
    c.str('paymentMethodSummary', false);
    const status = c.value.status;
    if (status === 'paused' && !c.value.pausedUntil && c.value.pauseOpenEnded !== true) c.report('missing-field', 'pausedUntil', 'A paused subscription needs "pausedUntil" or "pauseOpenEnded": true.');
    if (status !== 'paused' && (c.value.pausedUntil !== undefined || c.value.pauseOpenEnded)) c.report('invalid-field', 'pausedUntil', 'Only paused subscriptions have "pausedUntil" or "pauseOpenEnded".');
    if (c.value.cancelAtPeriodEnd && status !== 'active' && status !== 'trialing') c.report('invalid-field', 'cancelAtPeriodEnd', '"cancelAtPeriodEnd" is only for active or trialing subscriptions.');
    if (status !== 'cancelled' && c.value.cancelledAt !== undefined) c.report('invalid-field', 'cancelledAt', 'Only cancelled subscriptions have "cancelledAt".');
    if (typeof c.value.paymentMethodSummary === 'string' && /\d{8,}/.test(c.value.paymentMethodSummary.replace(/[\s-]/g, ''))) c.report('invalid-field', 'paymentMethodSummary', '"paymentMethodSummary" must not contain a full card number (use "Card ending 4242").');
    const currency = isObj(c.value.price) && typeof c.value.price.currency === 'string' ? c.value.price.currency : undefined;
    c.each('availablePlans', 0, 12, (p) => {
      p.str('id');
      p.str('name');
      moneyField(p, 'price', true, currency);
      p.child('interval', true, (i) => {
        i.oneOf('unit', UNITS);
        intField(i, 'count', 1, true);
      });
      p.strings('features', true);
    });
    uniqueIds(c, 'availablePlans');
    if (Array.isArray(c.value.availablePlans) && c.value.availablePlans.length > 0) {
      const current = c.value.availablePlans.filter((p) => isObj(p) && p.current === true).length;
      if (current !== 1) c.report('invalid-field', 'availablePlans', `"availablePlans" must have exactly one current plan (found ${current}).`);
    }
  });
}

/** Customer: id, name, email and creation date. */
export function validateCustomer(customer: unknown): ValidationIssue[] {
  return run(customer, (c) => {
    c.str('id');
    c.str('name');
    c.str('email');
    if (typeof c.value.email === 'string' && !EMAIL.test(c.value.email)) c.report('invalid-field', 'email', '"email" must be an email address.');
    c.date('createdAt');
  });
}

/** Invoice: number, date, amount, status and a safe href. */
export function validateInvoice(invoice: unknown): ValidationIssue[] {
  return run(invoice, (c) => {
    c.str('id');
    c.str('number');
    c.date('issuedAt');
    c.str('description');
    moneyField(c, 'amount', true);
    c.oneOf('status', INVOICE_STATUS);
    c.href('href', false);
    c.str('subscriptionId', false);
    c.str('orderId', false);
  });
}

/** Saved address: an address plus id, optional label and default flags. */
export function validateSavedAddress(address: unknown): ValidationIssue[] {
  return run(address, (c) => {
    c.str('id');
    c.str('label', false);
    c.str('name');
    c.str('line1');
    c.str('city');
    c.str('postalCode');
    if (typeof c.value.country !== 'string' || !/^[A-Z]{2}$/.test(c.value.country)) c.report('invalid-field', 'country', '"country" must be an ISO 3166-1 alpha-2 code such as "US".');
    for (const key of ['isDefaultShipping', 'isDefaultBilling']) if (c.value[key] !== undefined && typeof c.value[key] !== 'boolean') c.report('invalid-field', key, `"${key}" must be true or false.`);
  });
}

/** An address book: each address validates, unique ids, at most one default per kind. */
export function validateAddressBook(addresses: unknown): ValidationIssue[] {
  if (!Array.isArray(addresses)) return [{ code: 'invalid-field', severity: 'error', message: 'Expected an array of addresses.', path: '' }];
  const issues = addresses.flatMap((a, i) => validateSavedAddress(a).map((issue) => ({ ...issue, path: issue.path ? `[${i}].${issue.path}` : `[${i}]` })));
  const ids = addresses.map((a) => (isObj(a) ? a.id : undefined));
  ids.forEach((id, i) => ids.indexOf(id) !== i && issues.push({ code: 'duplicate-id', severity: 'error', message: `id ${JSON.stringify(id)} is used more than once.`, path: `[${i}].id` }));
  for (const key of ['isDefaultShipping', 'isDefaultBilling']) {
    const count = addresses.filter((a) => isObj(a) && a[key] === true).length;
    if (count > 1) issues.push({ code: 'invalid-field', severity: 'error', message: `More than one address has "${key}".`, path: '' });
  }
  return issues;
}

/** Wishlist item: product id and date added. */
export function validateWishlistItem(item: unknown): ValidationIssue[] {
  return run(item, (c) => {
    c.str('productId');
    c.date('addedAt');
  });
}

/** Library item: product, order, files (each like an order download) and an optional licence. */
export function validateLibraryItem(item: unknown): ValidationIssue[] {
  return run(item, (c) => {
    for (const key of ['productId', 'productTitle', 'orderId', 'orderNumber']) c.str(key);
    c.date('purchasedAt');
    c.each('files', 1, 50, (d) => {
      d.str('fileId');
      d.str('name');
      if (typeof d.value.available !== 'boolean') d.report('missing-field', 'available', '"available" is required (true or false).');
      if (d.value.available === false && typeof d.value.reason !== 'string') d.report('missing-field', 'reason', 'Unavailable files need a "reason".');
      d.date('expiresAt', false);
      intField(d, 'sizeBytes', 0);
    });
    uniqueIds(c, 'files', 'fileId');
    c.child('licence', false, (l) => {
      l.oneOf('type', ['single', 'team', 'unlimited']);
      l.str('summary');
    });
    c.str('licenseKey', false);
  });
}

/** Catalogue: every product, unique product ids and handles, collections referencing existing products. */
export function validateCatalog(catalog: unknown): ValidationIssue[] {
  return run(catalog, (c) => {
    const products = Array.isArray(c.value.products) ? c.value.products : [];
    products.forEach((product, i) => c.issues.push(...validateProduct(product).map((issue) => ({ ...issue, path: `products[${i}]${issue.path ? `.${issue.path}` : ''}` }))));
    uniqueIds(c, 'products');
    uniqueIds(c, 'products', 'handle');
    const ids = new Set(products.map((p) => (isObj(p) ? p.id : undefined)));
    c.each('collections', 0, 50, (col) => {
      col.image('image');
      col.str('id');
      col.str('handle');
      col.str('title');
      col.strings('productIds', true);
      (Array.isArray(col.value.productIds) ? col.value.productIds : []).forEach((id, j) => {
        if (!ids.has(id)) col.report('invalid-field', `productIds[${j}]`, `Product ${JSON.stringify(id)} is not in the catalogue.`);
      });
    });
    uniqueIds(c, 'collections');
  });
}
