import { describe, expect, it } from 'vitest';
import { getSubscriptionActions, getSubscriptionStatusInfo, MAX_ADDRESSES } from '../../logic/account';
import { validateAddressBook, validateCustomer, validateCustomerSubscription, validateInvoice, validateLibraryItem, validateOrder, validateWishlistItem } from '../../logic/validate';
import { DEMO_NOW } from '../store';
import { accountOrders, accountSubscriptions, addressBooks, customers, generateOrderHistory, invoiceSets, libraries, orderHistories, wishlistProducts, wishlists } from './index';

const roundTrip = (value: unknown) => expect(JSON.parse(JSON.stringify(value))).toEqual(value);

describe('account fixtures validate and round-trip', () => {
  it('customers', () => Object.values(customers).forEach((c) => (expect(validateCustomer(c)).toEqual([]), roundTrip(c))));

  it('subscriptions, with status text and actions for each', () => {
    for (const [key, sub] of Object.entries(accountSubscriptions)) {
      expect(validateCustomerSubscription(sub), key).toEqual([]);
      expect(getSubscriptionStatusInfo(sub, DEMO_NOW).description, key).not.toBe('');
      expect(getSubscriptionActions(sub).length, key).toBeGreaterThan(0);
      roundTrip(sub);
    }
  });

  it('invoices', () => {
    for (const [key, set] of Object.entries(invoiceSets)) set.forEach((inv) => expect(validateInvoice(inv), `${key} ${inv.id}`).toEqual([]));
    expect(new Set(invoiceSets.statuses.map((i) => i.status))).toEqual(new Set(['paid', 'open', 'failed', 'refunded']));
    expect(new Set(invoiceSets.twentyFour.map((i) => i.issuedAt.slice(0, 4))).size).toBe(3);
    roundTrip(invoiceSets);
  });

  it('libraries, address books and wishlists', () => {
    Object.values(libraries).flat().forEach((item) => expect(validateLibraryItem(item), item.productId).toEqual([]));
    for (const [key, book] of Object.entries(addressBooks)) expect(validateAddressBook(book), key).toEqual([]);
    expect(addressBooks.ten).toHaveLength(MAX_ADDRESSES);
    for (const list of Object.values(wishlists)) list.forEach((w) => expect(validateWishlistItem(w)).toEqual([]));
    expect(wishlists.fourteen).toHaveLength(14);
    expect(wishlists.fourteen.every((w) => wishlistProducts.some((p) => p.id === w.productId))).toBe(true);
    roundTrip({ libraries, addressBooks, wishlists });
  });

  it('orders: every status, and histories of 3, 12 and 60 that are deterministic', () => {
    for (const [key, order] of Object.entries(accountOrders)) expect(validateOrder(order), key).toEqual([]);
    for (const order of orderHistories.sixty) expect(validateOrder(order), order.number).toEqual([]);
    expect(orderHistories.three).toHaveLength(3);
    expect(orderHistories.twelve).toHaveLength(12);
    expect(orderHistories.sixty).toHaveLength(60);
    expect(generateOrderHistory(12)).toEqual(orderHistories.twelve);
    expect(new Set(orderHistories.sixty.map((o) => o.number)).size).toBe(60);
    expect(new Set(orderHistories.sixty.map((o) => o.status))).toEqual(new Set(['processing', 'shipped', 'delivered', 'cancelled', 'refunded']));
    const dates = orderHistories.sixty.map((o) => o.placedAt);
    expect([...dates].sort().reverse()).toEqual(dates); // newest first
    roundTrip(orderHistories.twelve);
  });
});
