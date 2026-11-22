/*
 * Validators for the commerce template pages. They reuse the core page checks (id, slug, seo) and the
 * commerce product and reviews validators, and add pagination sanity, selection and link checks.
 */
import { Checker, isObj, type ValidationIssue } from '../../registry/checker';
import { isSafeHref } from '../../registry/links';
import type { Product } from '../types/product';
import type { Cart } from '../types/cart';
import type { CheckoutStepId } from '../types/checkout';
import { computeCartTotals, type CartContext, type CartTotals } from './cart';
import { getCheckoutSteps } from './checkout';
import { validateAddressBook, validateCart, validateCustomer, validateCustomerSubscription, validateInvoice, validateLibraryItem, validateOrder, validateProduct, validateReviewsData, validateWishlistItem } from './validate';
import { purchaseOptionKey } from './options';
import { resolveVariant } from './variants';

const prefix = (issues: ValidationIssue[], path: string) => issues.map((issue) => ({ ...issue, path: issue.path ? `${path}.${issue.path}` : path }));

function base(page: unknown, check: (c: Checker) => void): ValidationIssue[] {
  if (!isObj(page)) return [{ code: 'invalid-field', severity: 'error', message: 'A page must be an object.', path: '' }];
  const issues: ValidationIssue[] = [];
  const c = new Checker(page, '', issues, {});
  c.str('id');
  if (typeof page.slug !== 'string') c.report('missing-field', 'slug', '"slug" is required.');
  c.child('seo', true, (seo) => seo.str('title'));
  check(c);
  return issues;
}

const breadcrumbs = (c: Checker, key = 'breadcrumbs', required = false) =>
  c.each(key, required ? 1 : 0, 8, (b) => {
    b.str('label');
    b.href('href', false);
  });

/** Collection page: header, breadcrumbs, products, total and pagination that agree, safe links. */
export function validateCollectionPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'collection') c.report('invalid-field', 'template', 'template must be "collection".');
    c.child('collection', true, (col) => {
      col.str('title');
      breadcrumbs(col);
      col.image('image');
    });
    c.child('listing', true, (l) => {
      const products = Array.isArray(l.value.products) ? l.value.products : [];
      products.forEach((product, i) => l.issues.push(...prefix(validateProduct(product), `listing.products[${i}]`)));
      const total = l.value.total;
      const perPage = l.value.perPage;
      if (typeof total !== 'number' || !Number.isInteger(total) || total < 0) l.report('invalid-field', 'total', '"total" must be a whole number of at least 0.');
      if (typeof perPage !== 'number' || !Number.isInteger(perPage) || perPage < 1) l.report('invalid-field', 'perPage', '"perPage" must be a whole number of at least 1.');
      l.oneOf('mode', ['pages', 'load-more']);
      l.child('pagination', true, (p) => {
        p.href('basePath');
        const { currentPage, totalPages } = p.value;
        if (typeof totalPages !== 'number' || !Number.isInteger(totalPages) || totalPages < 1) p.report('invalid-pagination', 'totalPages', '"totalPages" must be a whole number of at least 1.');
        else if (typeof currentPage !== 'number' || !Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) p.report('invalid-pagination', 'currentPage', `"currentPage" must be from 1 to ${totalPages}.`);
        else if (typeof total === 'number' && typeof perPage === 'number' && perPage > 0 && totalPages !== Math.max(1, Math.ceil(total / perPage))) {
          p.report('invalid-pagination', 'totalPages', `"totalPages" should be ${Math.max(1, Math.ceil(total / perPage))} for ${total} products at ${perPage} per page.`);
        }
      });
      if (typeof total === 'number' && products.length > total) l.report('invalid-field', 'products', 'More products than "total".');
      if (l.value.mode === 'pages' && typeof perPage === 'number' && products.length > perPage) l.report('invalid-field', 'products', 'A page in "pages" mode has more products than "perPage".');
    });
    c.each('subCollections', 0, 8, (s) => {
      s.str('title');
      s.href('href');
      s.image('image');
    });
  });
}

/** Product page: product, reviews and related products validate; the initial selection and purchase option exist. */
export function validateProductPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'product-detail') c.report('invalid-field', 'template', 'template must be "product-detail".');
    const product = c.value.product;
    if (!isObj(product)) c.report('missing-field', 'product', '"product" is required.');
    else c.issues.push(...prefix(validateProduct(product), 'product'));
    if (!isObj(c.value.reviews)) c.report('missing-field', 'reviews', '"reviews" is required.');
    else c.issues.push(...prefix(validateReviewsData(c.value.reviews), 'reviews'));
    if (!Array.isArray(c.value.related)) c.report('missing-field', 'related', '"related" is required (it may be empty).');
    else c.value.related.forEach((p, i) => c.issues.push(...prefix(validateProduct(p), `related[${i}]`)));
    breadcrumbs(c);
    const selection = c.value.initialSelection;
    if (selection !== undefined && isObj(product) && Array.isArray(product.variants)) {
      if (!isObj(selection) || !resolveVariant(product as unknown as Product, selection as Record<string, string>)) c.report('invalid-field', 'initialSelection', '"initialSelection" does not match a variant of the product.');
    }
    const option = c.value.initialPurchaseOption;
    if (option !== undefined && isObj(product) && Array.isArray(product.purchaseOptions)) {
      const keys = (product.purchaseOptions as Product['purchaseOptions']).map(purchaseOptionKey);
      if (!isObj(option) || !keys.includes(purchaseOptionKey(option as never))) c.report('invalid-field', 'initialPurchaseOption', '"initialPurchaseOption" is not one of the product’s purchase options.');
    }
    if (isObj(product) && Array.isArray(product.images)) {
      product.images.forEach((img, i) => {
        if (isObj(img) && typeof img.src === 'string' && !isSafeHref(img.src)) c.report('unsafe-src', `product.images[${i}].src`, 'Unsafe image source.');
      });
    }
  });
}

const linkChecks = (c: Checker) =>
  c.child('links', false, (l) => {
    for (const key of ['shop', 'cart', 'checkout', 'terms', 'order']) l.href(key, false);
  });

/** Totals must equal computeCartTotals for the cart (the template trusts them and does no pricing). */
function totalsMatch(c: Checker, cartContext: CartContext): CartTotals | undefined {
  const cart = c.value.cart;
  if (!isObj(cart)) {
    c.report('missing-field', 'cart', '"cart" is required.');
    return undefined;
  }
  c.issues.push(...prefix(validateCart(cart), 'cart'));
  if (!isObj(c.value.totals)) {
    c.report('missing-field', 'totals', '"totals" is required.');
    return undefined;
  }
  let expected: CartTotals;
  try {
    expected = computeCartTotals(cart as unknown as Cart, cartContext);
  } catch {
    return undefined; // validateCart already reported why
  }
  const given = c.value.totals as unknown as CartTotals;
  for (const key of ['subtotal', 'discount', 'shipping', 'tax', 'total', 'dueToday'] as const) {
    if (JSON.stringify(given[key]) !== JSON.stringify(expected[key])) c.report('invalid-field', `totals.${key}`, `"totals.${key}" does not match computeCartTotals for this cart (${expected[key].amount}).`);
  }
  if (JSON.stringify(given.flags) !== JSON.stringify(expected.flags)) c.report('invalid-field', 'totals.flags', '"totals.flags" do not match the cart.');
  return expected;
}

/** Cart page: cart validates, totals match computeCartTotals, issues point at real lines, safe links. */
export function validateCartPage(page: unknown, cartContext: CartContext): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'cart') c.report('invalid-field', 'template', 'template must be "cart".');
    totalsMatch(c, cartContext);
    const lineIds = new Set(isObj(c.value.cart) && Array.isArray(c.value.cart.lines) ? c.value.cart.lines.map((l) => (isObj(l) ? l.id : undefined)) : []);
    if (!Array.isArray(c.value.issues)) c.report('missing-field', 'issues', '"issues" is required (it may be empty).');
    else c.value.issues.forEach((issue, i) => isObj(issue) && !lineIds.has(issue.lineId) && c.report('invalid-field', `issues[${i}].lineId`, `Issue for unknown line ${JSON.stringify(issue.lineId)}.`));
    if (Array.isArray(c.value.crossSell)) c.value.crossSell.forEach((p, i) => c.issues.push(...prefix(validateProduct(p), `crossSell[${i}]`)));
    linkChecks(c);
  });
}

const STEPS = ['information', 'shipping', 'payment', 'review'] as const;

/** Checkout page: cart and totals as for the cart page, the step exists for this cart, the chosen shipping method exists, safe links. */
export function validateCheckoutPage(page: unknown, cartContext: CartContext): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'checkout') c.report('invalid-field', 'template', 'template must be "checkout".');
    const totals = totalsMatch(c, cartContext);
    c.oneOf('step', STEPS);
    if (totals && typeof c.value.step === 'string' && STEPS.includes(c.value.step as never) && !getCheckoutSteps(totals.flags).includes(c.value.step as CheckoutStepId)) {
      c.report('invalid-field', 'step', `This cart has no "${c.value.step}" step (steps: ${getCheckoutSteps(totals.flags).join(', ')}).`);
    }
    c.child('values', true, (v) => {
      if (typeof v.value.email !== 'string') v.report('missing-field', 'email', '"email" is required (it may be empty).');
      if (typeof v.value.billingSameAsShipping !== 'boolean') v.report('missing-field', 'billingSameAsShipping', '"billingSameAsShipping" is required.');
      if (typeof v.value.termsAccepted !== 'boolean') v.report('missing-field', 'termsAccepted', '"termsAccepted" is required.');
      if (v.value.paymentMethod !== undefined) v.oneOf('paymentMethod', ['card', 'wallet']);
    });
    if (!Array.isArray(c.value.shippingMethods)) c.report('missing-field', 'shippingMethods', '"shippingMethods" is required (it may be empty).');
    const methodId = isObj(c.value.values) ? c.value.values.shippingMethodId : undefined;
    if (typeof methodId === 'string' && Array.isArray(c.value.shippingMethods) && !c.value.shippingMethods.some((m) => isObj(m) && m.id === methodId)) {
      c.report('invalid-field', 'values.shippingMethodId', `Shipping method ${JSON.stringify(methodId)} is not offered.`);
    }
    if (c.value.status !== undefined) c.oneOf('status', ['idle', 'submitting', 'error']);
    linkChecks(c);
  });
}

/** Confirmation page: the order validates; safe links. */
export function validateConfirmationPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'order-confirmation') c.report('invalid-field', 'template', 'template must be "order-confirmation".');
    if (!isObj(c.value.order)) c.report('missing-field', 'order', '"order" is required.');
    else c.issues.push(...prefix(validateOrder(c.value.order), 'order'));
    linkChecks(c);
  });
}

const AUTH = ['login', 'register', 'forgot-password', 'reset-password'];
const accountLinks = (c: Checker) =>
  c.child('links', false, (l) => {
    for (const key of ['login', 'register', 'forgotPassword', 'shop', 'terms', 'privacy', 'support']) l.href(key, false);
  });

/** Auth pages: a known template, a safe action and safe links. */
export function validateAuthPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    if (!AUTH.includes(c.value.template as string)) c.report('invalid-field', 'template', `template must be one of ${AUTH.join(', ')}.`);
    if (c.value.action !== undefined && c.value.action !== '') c.href('action', false);
    if (c.value.status !== undefined) c.oneOf('status', ['idle', 'submitting', 'error', 'success']);
    if (c.value.layout !== undefined) c.oneOf('layout', ['minimal', 'default']);
    accountLinks(c);
  });
}

const list = (c: Checker, key: string, validate: (value: unknown) => ValidationIssue[]) => {
  const value = c.value[key];
  if (!Array.isArray(value)) return c.report('missing-field', key, `"${key}" is required (it may be empty).`);
  value.forEach((item, i) => c.issues.push(...prefix(validate(item), `${key}[${i}]`)));
};

/**
 * Account pages: the customer (or null), `now`, safe links, and the data each template needs, each
 * item checked with its own validator.
 */
export function validateAccountPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    const customer = c.value.customer;
    if (customer !== null) {
      if (!isObj(customer)) c.report('missing-field', 'customer', '"customer" is required (null when signed out).');
      else c.issues.push(...prefix(validateCustomer(customer), 'customer'));
    }
    c.date('now');
    accountLinks(c);
    switch (c.value.template) {
      case 'account':
        list(c, 'orders', validateOrder);
        list(c, 'subscriptions', validateCustomerSubscription);
        list(c, 'invoices', validateInvoice);
        list(c, 'downloads', validateLibraryItem);
        c.issues.push(...prefix(validateAddressBook(c.value.addresses), 'addresses'));
        list(c, 'wishlist', validateWishlistItem);
        break;
      case 'account-orders':
        list(c, 'orders', validateOrder);
        if (typeof c.value.totalCount !== 'number') c.report('missing-field', 'totalCount', '"totalCount" is required.');
        c.strings('years', true);
        break;
      case 'account-order':
        if (!isObj(c.value.order)) c.report('missing-field', 'order', '"order" is required.');
        else c.issues.push(...prefix(validateOrder(c.value.order), 'order'));
        c.href('invoiceHref', false);
        break;
      case 'account-downloads':
        list(c, 'items', validateLibraryItem);
        break;
      case 'account-subscriptions':
        list(c, 'subscriptions', validateCustomerSubscription);
        break;
      case 'account-subscription':
        if (!isObj(c.value.subscription)) c.report('missing-field', 'subscription', '"subscription" is required.');
        else c.issues.push(...prefix(validateCustomerSubscription(c.value.subscription), 'subscription'));
        list(c, 'invoices', validateInvoice);
        break;
      case 'account-addresses':
        c.issues.push(...prefix(validateAddressBook(c.value.addresses), 'addresses'));
        break;
      case 'account-wishlist':
        list(c, 'items', validateWishlistItem);
        list(c, 'products', validateProduct);
        break;
      default:
        c.report('invalid-field', 'template', 'Not an account template.');
    }
  });
}
