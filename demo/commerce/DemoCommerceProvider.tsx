/*
 * DEMO ONLY. Storybook cart provider: React context plus useReducer, in memory only. Totals come from
 * computeCartTotals; this file contains no pricing logic. Never ship this as production cart logic.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react';
import { useToasts, type ToastData } from '../../src/components/Toast';
import type { CheckoutStepId, CheckoutValues, Order } from '../../src/commerce';
import { computeCartTotals, type Cart, type CartTotals, type Product, type PurchaseOption } from '../../src/commerce';
import { carts, DEMO_NOW, promoDefinitions, shippingMethods, type CartFixtureKey } from '../../src/commerce/fixtures';
import { checkoutReducer, initialCheckoutState, type DemoCheckoutState } from './checkoutReducer';
import { checkPromo, createDemoReducer, initialDemoState, type DemoState, type PromoResult } from './reducer';

export interface DemoCart {
  cart: Cart;
  totals: CartTotals;
  lastAction: DemoState['lastAction'];
  log: string[];
  addLine: (product: Product, variantId: string, quantity?: number, purchaseOption?: PurchaseOption) => void;
  removeLine: (lineId: string) => void;
  setQuantity: (lineId: string, quantity: number) => void;
  setPurchaseOption: (lineId: string, purchaseOption: PurchaseOption) => void;
  /** Validates (case-insensitive, duplicates ignored) and applies; returns what happened. */
  applyPromo: (code: string) => PromoResult;
  removePromo: (code: string) => void;
  setShippingMethod: (methodId: string | undefined) => void;
  clear: () => void;
  /** Loads a cart fixture by key. */
  replaceCart: (key: CartFixtureKey) => void;
}

export interface DemoCheckout extends Omit<DemoCheckoutState, 'placed'> {
  /** Replaces the values; a new shipping method is also set on the cart so totals follow. */
  setValues: (values: CheckoutValues) => void;
  /** Moves to a step if every earlier step is valid. */
  goTo: (step: CheckoutStepId) => void;
  /** Validates every step, then builds the order (or fails when the story sets demo.failPlaceOrder). */
  placeOrder: () => void;
  /** Starts again (keeps the order counter). */
  reset: () => void;
  lastOrder: Order | null;
}

export interface DemoToasts {
  toasts: ToastData[];
  dismiss: (id: string) => void;
}

const DemoCommerceContext = createContext<DemoCart | null>(null);
const DemoCheckoutContext = createContext<DemoCheckout | null>(null);
const DemoToastsContext = createContext<DemoToasts | null>(null);

/** Cart actions that get a toast, and what it says. Other actions stay quiet. */
function toastFor(action: NonNullable<DemoState['lastAction']>): Omit<ToastData, 'id'> | null {
  if (!action.ok) return action.type === 'applyPromo' ? { tone: 'danger', title: 'Promo code not applied', message: action.message } : null;
  if (action.type === 'addLine') return { tone: 'success', title: 'Added to cart', message: action.message, action: { label: 'View cart', href: '/cart' } };
  if (action.type === 'removeLine') return { tone: 'info', title: 'Removed from cart', message: action.message };
  if (action.type === 'applyPromo') return { tone: 'success', title: 'Promo code applied', message: action.message };
  return null;
}
const reducer = createDemoReducer(promoDefinitions);

export interface DemoCommerceProviderProps {
  /** Cart fixture to start with. Default "empty". */
  initialCart?: CartFixtureKey;
  /** Fixed "now" for trial and renewal dates. Default DEMO_NOW. */
  now?: string;
  /** Starting checkout values (e.g. a fixture). Default empty. */
  initialCheckout?: CheckoutValues;
  /** Make placeOrder fail (the story parameter demo.failPlaceOrder). */
  failPlaceOrder?: boolean;
  children: ReactNode;
}

export function DemoCommerceProvider({ initialCart = 'empty', now = DEMO_NOW, initialCheckout, failPlaceOrder = false, children }: DemoCommerceProviderProps) {
  const [state, dispatch] = useReducer(reducer, carts[initialCart], initialDemoState);
  const totals = useMemo(() => computeCartTotals(state.cart, { promoDefinitions, shippingMethods, now }), [state.cart, now]);

  const applyPromo = useCallback(
    (code: string) => {
      const result = checkPromo(state.cart, code, promoDefinitions);
      dispatch({ type: 'applyPromo', code });
      return result;
    },
    [state.cart],
  );

  const value = useMemo<DemoCart>(
    () => ({
      cart: state.cart,
      totals,
      lastAction: state.lastAction,
      log: state.log,
      addLine: (product, variantId, quantity, purchaseOption) => dispatch({ type: 'addLine', product, variantId, quantity, purchaseOption }),
      removeLine: (lineId) => dispatch({ type: 'removeLine', lineId }),
      setQuantity: (lineId, quantity) => dispatch({ type: 'setQuantity', lineId, quantity }),
      setPurchaseOption: (lineId, purchaseOption) => dispatch({ type: 'setPurchaseOption', lineId, purchaseOption }),
      applyPromo,
      removePromo: (code) => dispatch({ type: 'removePromo', code }),
      setShippingMethod: (methodId) => dispatch({ type: 'setShippingMethod', methodId }),
      clear: () => dispatch({ type: 'clear' }),
      replaceCart: (key) => dispatch({ type: 'replaceCart', cart: carts[key] }),
    }),
    [state, totals, applyPromo],
  );

  // Checkout: values, step, errors and the placed order, in memory.
  const [checkout, checkoutDispatch] = useReducer(checkoutReducer, initialCheckout, initialCheckoutState);
  const checkoutValue = useMemo<DemoCheckout>(
    () => ({
      values: checkout.values,
      step: checkout.step,
      errors: checkout.errors,
      status: checkout.status,
      errorMessage: checkout.errorMessage,
      lastOrder: checkout.lastOrder,
      setValues: (values) => {
        if (values.shippingMethodId !== state.cart.shippingMethodId) dispatch({ type: 'setShippingMethod', methodId: values.shippingMethodId });
        checkoutDispatch({ type: 'change', values });
      },
      goTo: (step) => checkoutDispatch({ type: 'goTo', step, flags: totals.flags }),
      placeOrder: () => checkoutDispatch({ type: 'placeOrder', cart: state.cart, flags: totals.flags, fail: failPlaceOrder }),
      reset: () => checkoutDispatch({ type: 'reset' }),
    }),
    [checkout, state.cart, totals.flags, failPlaceOrder],
  );

  // Toasts for cart actions: no timers (auto-dismiss stays off); dismissed with their button.
  const { toasts, show, dismiss } = useToasts();
  const seen = useRef(state.lastAction);
  useEffect(() => {
    if (!state.lastAction || state.lastAction === seen.current) return;
    seen.current = state.lastAction;
    const toast = toastFor(state.lastAction);
    if (toast) show(toast);
  }, [state.lastAction, show]);
  const toastValue = useMemo(() => ({ toasts, dismiss }), [toasts, dismiss]);

  return (
    <DemoCommerceContext.Provider value={value}>
      <DemoCheckoutContext.Provider value={checkoutValue}>
        <DemoToastsContext.Provider value={toastValue}>{children}</DemoToastsContext.Provider>
      </DemoCheckoutContext.Provider>
    </DemoCommerceContext.Provider>
  );
}

/** The demo checkout. Throws outside DemoCommerceProvider. */
export function useDemoCheckout(): DemoCheckout {
  const value = useContext(DemoCheckoutContext);
  if (!value) throw new Error('useDemoCheckout must be used inside <DemoCommerceProvider>.');
  return value;
}

/** Toasts for the demo cart's actions (added, removed, promo applied). Render them with <ToastRegion>. */
export function useDemoToasts(): DemoToasts {
  const value = useContext(DemoToastsContext);
  if (!value) throw new Error('useDemoToasts must be used inside <DemoCommerceProvider>.');
  return value;
}

/** The demo cart. Throws outside DemoCommerceProvider. */
export function useDemoCart(): DemoCart {
  const value = useContext(DemoCommerceContext);
  if (!value) throw new Error('useDemoCart must be used inside <DemoCommerceProvider> (or the withDemoCommerce decorator).');
  return value;
}
