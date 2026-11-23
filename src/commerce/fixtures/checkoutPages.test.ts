/*
 * Phase 11 page fixtures: validators for the cart, checkout and confirmation pages, the registry merge,
 * and SSR heading outlines for every template state.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageRenderer } from '../../templates/PageRenderer';
import { createTemplates, getTemplate } from '../../templates/registry';
import { nextSteps } from '../templates/OrderConfirmationTemplate';
import { validateCartPage, validateCheckoutPage, validateConfirmationPage } from '../logic/validatePages';
import { commerceTemplates } from '../templates';
import type { CheckoutStepId } from '../types/checkout';
import { cartPage, checkoutPage, checkoutValues, chrome, confirmationOrders, confirmationPage, demoCartContext, type ConfirmationOrderKey } from './index';

describe('validateCartPage', () => {
  it('accepts every cart page fixture', () => {
    for (const key of ['physicalOnly', 'digitalOnly', 'subscriptionOnly', 'mixed', 'empty', 'twentyLines', 'withPromo', 'withOutOfStockLine'] as const) {
      expect(validateCartPage(cartPage(key), demoCartContext), key).toEqual([]);
    }
  });

  it('reports totals that do not match computeCartTotals, unknown issue lines and unsafe links', () => {
    const page = cartPage('physicalOnly');
    const tampered = { ...page, totals: { ...page.totals, total: { amount: 1, currency: 'USD' } }, issues: [{ ...page.issues[0], lineId: 'nope' }], links: { shop: 'javascript:alert(1)' } };
    const paths = validateCartPage(tampered, demoCartContext).map((i) => i.path);
    expect(paths).toEqual(expect.arrayContaining(['totals.total', 'issues[0].lineId', 'links.shop']));
  });
});

describe('validateCheckoutPage', () => {
  it('accepts each step for each cart kind', () => {
    const cases: [Parameters<typeof checkoutPage>[0], CheckoutStepId[], keyof typeof checkoutValues][] = [
      ['physicalOnly', ['information', 'shipping', 'payment', 'review'], 'physical'],
      ['digitalOnly', ['information', 'payment', 'review'], 'digital'],
      ['subscriptionWithTrial', ['information', 'payment', 'review'], 'subscription'],
      ['mixed', ['information', 'shipping', 'payment', 'review'], 'mixed'],
    ];
    for (const [key, steps, values] of cases) for (const step of steps) expect(validateCheckoutPage(checkoutPage(key, step, checkoutValues[values]), demoCartContext), `${key} ${step}`).toEqual([]);
  });

  it('reports a shipping step for a digital-only cart and an unknown shipping method', () => {
    expect(validateCheckoutPage(checkoutPage('digitalOnly', 'shipping', checkoutValues.digital), demoCartContext).map((i) => i.path)).toEqual(['step']);
    const page = checkoutPage('physicalOnly', 'review', checkoutValues.physical);
    const issues = validateCheckoutPage({ ...page, values: { ...page.values, shippingMethodId: 'ship-drone' } }, demoCartContext);
    expect(issues.map((i) => i.path)).toEqual(['values.shippingMethodId']);
  });

  it('reports totals that were not computed for this cart', () => {
    const page = checkoutPage('mixed', 'payment', checkoutValues.mixed);
    const wrong = { ...page, totals: checkoutPage('physicalOnly', 'payment', checkoutValues.physical).totals };
    expect(validateCheckoutPage(wrong, demoCartContext).map((i) => i.path)).toEqual(expect.arrayContaining(['totals.subtotal', 'totals.flags']));
  });
});

describe('validateConfirmationPage', () => {
  it('accepts every confirmation fixture and reports a broken order', () => {
    for (const key of Object.keys(confirmationOrders) as ConfirmationOrderKey[]) expect(validateConfirmationPage(confirmationPage(key)), key).toEqual([]);
    const broken = confirmationPage('physical');
    expect(validateConfirmationPage({ ...broken, order: { ...broken.order, lines: [] } }).map((i) => i.path)).toEqual(['order.lines']);
  });
});

describe('next steps by kind', () => {
  const titles = (key: ConfirmationOrderKey) => nextSteps(confirmationOrders[key]).map((s) => s.title);
  it('combines shipping, downloads and subscription steps', () => {
    expect(titles('physical')).toEqual(['Order placed', 'Your order is packed and shipped', 'Tracking follows']);
    expect(titles('digital')).toEqual(['Order placed', 'Download your files']);
    expect(titles('subscriptionTrial')).toEqual(['Order placed', 'Your subscription starts']);
    expect(titles('mixed')).toEqual(['Order placed', 'Download your files', 'Your order is packed and shipped', 'Tracking follows', 'Your subscription starts']);
  });
});

describe('cart, checkout and confirmation in the registry', () => {
  const templates = createTemplates(Object.values(commerceTemplates));

  it('registers the three templates', () => {
    expect(getTemplate('cart', templates)).toBe(commerceTemplates.cart);
    expect(getTemplate('checkout', templates)).toBe(commerceTemplates.checkout);
    expect(getTemplate('order-confirmation', templates)).toBe(commerceTemplates['order-confirmation']);
  });

  it('renders every state with exactly one h1 and no skipped heading levels', () => {
    const pages = [
      cartPage('physicalOnly'),
      cartPage('mixed'),
      cartPage('empty'),
      cartPage('withOutOfStockLine'),
      cartPage('physicalOnly', { status: 'loading' }),
      cartPage('physicalOnly', { status: 'error' }),
      ...(['information', 'shipping', 'payment', 'review'] as const).map((step) => checkoutPage('mixed', step, checkoutValues.mixed)),
      checkoutPage('digitalOnly', 'payment', checkoutValues.digital),
      checkoutPage('empty', 'information', checkoutValues.empty),
      checkoutPage('withOutOfStockLine', 'information', checkoutValues.physical),
      ...(Object.keys(confirmationOrders) as ConfirmationOrderKey[]).map(confirmationPage),
    ];
    for (const page of pages) {
      const html = renderToStaticMarkup(createElement(PageRenderer, { page, chrome, templates }));
      const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
      expect(levels.filter((l) => l === 1), page.id).toHaveLength(1);
      expect(levels.flatMap((l, i) => (i > 0 && l > levels[i - 1]! + 1 ? [`${levels[i - 1]}→${l}`] : [])), page.id).toEqual([]);
    }
  });

  it('page fixtures round-trip through JSON', () => {
    const pages = [cartPage('mixed'), checkoutPage('mixed', 'review', checkoutValues.mixed), confirmationPage('mixed')];
    expect(JSON.parse(JSON.stringify(pages))).toEqual(pages);
  });
});
