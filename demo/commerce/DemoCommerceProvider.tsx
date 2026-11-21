/*
 * DEMO ONLY. Storybook cart provider: React context plus useReducer, in memory only. Totals come from
 * computeCartTotals; this file contains no pricing logic. Never ship this as production cart logic.
 */
import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react';
import { computeCartTotals, type Cart, type CartTotals, type Product, type PurchaseOption } from '../../src/commerce';
import { carts, DEMO_NOW, promoDefinitions, shippingMethods, type CartFixtureKey } from '../../src/commerce/fixtures';
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

const DemoCommerceContext = createContext<DemoCart | null>(null);
const reducer = createDemoReducer(promoDefinitions);

export interface DemoCommerceProviderProps {
  /** Cart fixture to start with. Default "empty". */
  initialCart?: CartFixtureKey;
  /** Fixed "now" for trial and renewal dates. Default DEMO_NOW. */
  now?: string;
  children: ReactNode;
}

export function DemoCommerceProvider({ initialCart = 'empty', now = DEMO_NOW, children }: DemoCommerceProviderProps) {
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

  return <DemoCommerceContext.Provider value={value}>{children}</DemoCommerceContext.Provider>;
}

/** The demo cart. Throws outside DemoCommerceProvider. */
export function useDemoCart(): DemoCart {
  const value = useContext(DemoCommerceContext);
  if (!value) throw new Error('useDemoCart must be used inside <DemoCommerceProvider> (or the withDemoCommerce decorator).');
  return value;
}
