/*
 * DEMO ONLY: in-memory account state for Storybook. Pure: `now` and the failure flag are passed in; new
 * ids come from a counter in state. Nothing is stored or sent anywhere.
 */
import { addInterval, formatCommerceDate } from '../../src/commerce/logic/pricing';
import { getSubscriptionActions, removeAddress, setDefaultAddress, type AddressKind } from '../../src/commerce/logic/account';
import type { SubscriptionActionRequest } from '../../src/commerce/components/ManageSubscription';
import type { Customer, CustomerSubscription, Invoice, LibraryItem, Order, SavedAddress, WishlistItem } from '../../src/commerce';

export interface DemoAccountState {
  customer: Customer | null;
  orders: Order[];
  subscriptions: CustomerSubscription[];
  invoices: Invoice[];
  downloads: LibraryItem[];
  addresses: SavedAddress[];
  wishlist: WishlistItem[];
  /** Next new address number ("adr-new-<n>"). */
  nextAddress: number;
  /** The last failed action, for error states in the UI. */
  lastError: { scope: string; message: string } | null;
}

export type DemoAccountAction =
  | { type: 'subscription'; id: string; request: SubscriptionActionRequest }
  | { type: 'saveAddress'; address: Omit<SavedAddress, 'id'> & { id?: string } }
  | { type: 'deleteAddress'; id: string }
  | { type: 'setDefaultAddress'; id: string; kind: AddressKind }
  | { type: 'removeWishlistItem'; productId: string };

export type DemoAccountResult = { ok: true; message: string } | { ok: false; reason: 'not-allowed' | 'not-found' | 'server'; message: string };

export interface DemoAccountContext {
  /** ISO 8601 demo "now". */
  now: string;
  /** Simulate a server error (story parameter demo.failAction). */
  fail?: boolean;
}

const actionFor = (request: SubscriptionActionRequest) => request.type;

function subscriptionChange(sub: CustomerSubscription, request: SubscriptionActionRequest, now: string): { sub: CustomerSubscription; message: string } {
  const today = now.slice(0, 10);
  switch (request.type) {
    case 'pause': {
      const { cancelAtPeriodEnd: _c, ...rest } = sub;
      return { sub: { ...rest, status: 'paused', pausedUntil: request.resumesOn, nextBillingAt: request.resumesOn }, message: `${sub.productTitle} is paused until ${formatCommerceDate(request.resumesOn)}.` };
    }
    case 'resume': {
      const { pausedUntil: _p, pauseOpenEnded: _o, ...rest } = sub;
      const next = addInterval(now, sub.interval);
      return { sub: { ...rest, status: 'active', nextBillingAt: next, currentPeriodEnd: next }, message: `${sub.productTitle} is active again. Next charge ${formatCommerceDate(next)}.` };
    }
    case 'change-plan': {
      const plan = sub.availablePlans!.find((p) => p.id === request.planId)!;
      return {
        sub: { ...sub, plan: plan.name, price: plan.price, interval: plan.interval, availablePlans: sub.availablePlans!.map(({ current: _c, ...p }) => (p.id === plan.id ? { ...p, current: true } : p)) },
        message: `${sub.productTitle} is now on the ${plan.name} plan from ${formatCommerceDate(sub.nextBillingAt ?? today)}.`,
      };
    }
    case 'cancel': {
      const end = sub.currentPeriodEnd ?? sub.trialEndsAt ?? sub.nextBillingAt ?? today;
      return { sub: { ...sub, cancelAtPeriodEnd: true, currentPeriodEnd: end }, message: `${sub.productTitle} cancels on ${formatCommerceDate(end)}.` };
    }
    case 'undo-cancel': {
      const { cancelAtPeriodEnd: _c, ...rest } = sub;
      return { sub: rest, message: `${sub.productTitle} will keep renewing.` };
    }
    case 'reactivate': {
      const { cancelledAt: _c, ...rest } = sub;
      const next = addInterval(now, sub.interval);
      return { sub: { ...rest, status: 'active', startedAt: today, nextBillingAt: next, currentPeriodEnd: next }, message: `${sub.productTitle} is active again. Next charge ${formatCommerceDate(next)}.` };
    }
    case 'update-payment':
      return { sub, message: 'Demo: your payment provider’s secure form would open here. Nothing was changed.' };
  }
}

/** Applies an action and says what happened. Invalid or failed actions leave the state unchanged. */
export function applyAccountAction(state: DemoAccountState, action: DemoAccountAction, ctx: DemoAccountContext): { state: DemoAccountState; result: DemoAccountResult } {
  const fail = (scope: string, reason: Extract<DemoAccountResult, { ok: false }>['reason'], message: string) => ({ state: { ...state, lastError: { scope, message } }, result: { ok: false as const, reason, message } });
  const done = (next: Partial<DemoAccountState>, message: string) => ({ state: { ...state, ...next, lastError: null }, result: { ok: true as const, message } });

  switch (action.type) {
    case 'subscription': {
      const sub = state.subscriptions.find((s) => s.id === action.id);
      if (!sub) return fail(action.id, 'not-found', 'That subscription no longer exists.');
      if (!getSubscriptionActions(sub).includes(actionFor(action.request))) return fail(action.id, 'not-allowed', `You can’t ${actionFor(action.request).replace('-', ' ')} this subscription right now.`);
      if (action.request.type === 'change-plan' && !sub.availablePlans?.some((p) => p.id === (action.request as { planId: string }).planId && !p.current)) return fail(action.id, 'not-allowed', 'Choose a different plan.');
      if (ctx.fail) return fail(action.id, 'server', 'Demo: the server didn’t respond. Nothing has changed. Try again.');
      const { sub: next, message } = subscriptionChange(sub, action.request, ctx.now);
      return done({ subscriptions: state.subscriptions.map((s) => (s.id === sub.id ? next : s)) }, message);
    }
    case 'saveAddress': {
      if (ctx.fail) return fail('addresses', 'server', 'Demo: the address couldn’t be saved. Try again.');
      const { id } = action.address;
      if (id) {
        if (!state.addresses.some((a) => a.id === id)) return fail('addresses', 'not-found', 'That address no longer exists.');
        return done({ addresses: state.addresses.map((a) => (a.id === id ? ({ ...a, ...action.address } as SavedAddress) : a)) }, `Saved ${action.address.label || action.address.name}.`);
      }
      if (state.addresses.length >= 10) return fail('addresses', 'not-allowed', 'You already have 10 addresses.');
      const first = state.addresses.length === 0;
      const added = { ...action.address, id: `adr-new-${state.nextAddress}`, ...(first ? { isDefaultShipping: true, isDefaultBilling: true } : {}) } as SavedAddress;
      return done({ addresses: [...state.addresses, added], nextAddress: state.nextAddress + 1 }, `Added ${added.label || added.name}.`);
    }
    case 'deleteAddress': {
      const address = state.addresses.find((a) => a.id === action.id);
      if (!address) return fail('addresses', 'not-found', 'That address no longer exists.');
      if (ctx.fail) return fail('addresses', 'server', 'Demo: the address couldn’t be deleted. Try again.');
      return done({ addresses: removeAddress(state.addresses, action.id) }, `Deleted ${address.label || address.name}.`);
    }
    case 'setDefaultAddress': {
      const address = state.addresses.find((a) => a.id === action.id);
      if (!address) return fail('addresses', 'not-found', 'That address no longer exists.');
      if (ctx.fail) return fail('addresses', 'server', 'Demo: the default couldn’t be changed. Try again.');
      return done({ addresses: setDefaultAddress(state.addresses, action.id, action.kind) }, `${address.label || address.name} is now your default ${action.kind} address.`);
    }
    case 'removeWishlistItem': {
      if (!state.wishlist.some((w) => w.productId === action.productId)) return fail('wishlist', 'not-found', 'That item is no longer in your wishlist.');
      if (ctx.fail) return fail('wishlist', 'server', 'Demo: the item couldn’t be removed. Try again.');
      return done({ wishlist: state.wishlist.filter((w) => w.productId !== action.productId) }, 'Removed from your wishlist.');
    }
  }
}

/** Reducer form, with the context bound in. */
export const createAccountReducer = (ctx: DemoAccountContext) => (state: DemoAccountState, action: DemoAccountAction) => applyAccountAction(state, action, ctx).state;
