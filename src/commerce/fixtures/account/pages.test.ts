import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { PageRenderer } from '../../../templates/PageRenderer';
import { createTemplates, getTemplate, resolveTemplate } from '../../../templates/registry';
import { validateAccountPage, validateAuthPage } from '../../logic/validatePages';
import { commerceTemplates } from '../../templates';
import type { AccountPage, AuthPage } from '../../types/account-pages';
import { chrome } from '../browsing';
import { orderHistories } from './orders';
import { addressesPage, authPage, dashboardPage, downloadsPage, orderPage, ordersPage, signedOutPage, subscriptionPage, subscriptionsPage, wishlistPage } from './pages';

const accountPages: AccountPage[] = [
  dashboardPage('rich'),
  dashboardPage('calm'),
  dashboardPage('fresh'),
  ordersPage(orderHistories.sixty, {}, 2),
  ordersPage(orderHistories.none),
  orderPage('mixed'),
  orderPage('digital'),
  orderPage('cancelled'),
  downloadsPage('six', 'order'),
  downloadsPage('none'),
  subscriptionsPage(),
  subscriptionPage('active'),
  subscriptionPage('pastDue'),
  subscriptionPage('cancelled'),
  addressesPage('ten'),
  addressesPage('none'),
  wishlistPage('fourteen'),
  wishlistPage('none'),
  signedOutPage(),
];
const authPages: AuthPage[] = [authPage('login'), authPage('register', { status: 'error' }), authPage('forgot-password', { status: 'success', email: 'robin@example.com' }), authPage('reset-password', { expired: true })];

describe('account page validators', () => {
  it('accept every page fixture', () => {
    for (const page of accountPages) expect(validateAccountPage(page), page.id).toEqual([]);
    for (const page of authPages) expect(validateAuthPage(page), page.id).toEqual([]);
  });

  it('report a missing customer, bad data and unsafe links', () => {
    const page = subscriptionPage('active');
    const broken = { ...page, customer: undefined, links: { support: 'javascript:alert(1)' }, subscription: { ...page.subscription, status: 'paused' } };
    expect(validateAccountPage(broken).map((i) => i.path)).toEqual(expect.arrayContaining(['customer', 'links.support', 'subscription.pausedUntil']));
    expect(validateAuthPage({ ...authPage('login'), template: 'logout' }).map((i) => i.path)).toEqual(['template']);
    expect(validateAuthPage({ ...authPage('login'), action: 'javascript:void(0)' }).map((i) => i.path)).toEqual(['action']);
  });

  it('round-trip through JSON', () => {
    for (const page of [...accountPages, ...authPages]) expect(JSON.parse(JSON.stringify(page)), page.id).toEqual(JSON.parse(JSON.stringify(page)));
    expect(JSON.parse(JSON.stringify(dashboardPage('rich')))).toEqual(JSON.parse(JSON.stringify(dashboardPage('rich'))));
  });
});

describe('auth and account templates in the registry', () => {
  const templates = createTemplates(Object.values(commerceTemplates));

  it('registers all twelve', () => {
    for (const name of ['login', 'register', 'forgot-password', 'reset-password', 'account', 'account-orders', 'account-order', 'account-downloads', 'account-subscriptions', 'account-subscription', 'account-addresses', 'account-wishlist']) {
      expect(getTemplate(name, templates), name).toBe(commerceTemplates[name]);
    }
    expect(resolveTemplate({ id: 'x', slug: 'x', template: 'account-order', seo: { title: 'X' }, blocks: [] }, templates).definition).toBe(templates.default);
  });

  it('renders every page with exactly one h1, no skipped levels and no duplicate ids', () => {
    for (const page of [...accountPages, ...authPages]) {
      const html = renderToStaticMarkup(createElement(PageRenderer, { page, chrome, templates }));
      const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
      expect(levels.filter((l) => l === 1), page.id).toHaveLength(1);
      expect(levels.flatMap((l, i) => (i > 0 && l > levels[i - 1]! + 1 ? [`${levels[i - 1]}→${l}`] : [])), page.id).toEqual([]);
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i), page.id).toEqual([]);
    }
  });

  it('never puts a password or licence key in the markup', () => {
    const html = renderToStaticMarkup(createElement(PageRenderer, { page: downloadsPage('six'), chrome, templates }));
    expect(html).not.toContain('GDTB-7Q4M-K2XP-9VNA');
    expect(html).toContain('9VNA');
    const login = renderToStaticMarkup(createElement(PageRenderer, { page: authPage('login'), chrome, templates }));
    expect(login).toMatch(/type="password"[^>]*value=""|value=""[^>]*type="password"/);
  });
});
