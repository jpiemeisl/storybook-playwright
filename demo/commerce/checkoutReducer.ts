/*
 * DEMO ONLY: in-memory checkout state for Storybook. Pure: order ids come from a counter in state and
 * the time from the fixed demo context, never the clock or randomness. Failure is a flag the story
 * sets, never random.
 */
import { canEnterStep, createOrderFromCart, emptyCheckoutValues, firstInvalidStep, type CheckoutFlags } from '../../src/commerce/logic/checkout';
import type { Cart, CheckoutErrors, CheckoutStepId, CheckoutValues, Order } from '../../src/commerce';
import { orderContext } from '../../src/commerce/fixtures';

export interface DemoCheckoutState {
  values: CheckoutValues;
  step: CheckoutStepId;
  errors: CheckoutErrors;
  status: 'idle' | 'submitting' | 'error';
  errorMessage?: string;
  lastOrder: Order | null;
  /** Orders placed so far; the next order number is FH-<2101 + placed>. */
  placed: number;
}

export type DemoCheckoutAction =
  | { type: 'change'; values: CheckoutValues }
  | { type: 'goTo'; step: CheckoutStepId; flags: CheckoutFlags }
  | { type: 'placeOrder'; cart: Cart; flags: CheckoutFlags; fail: boolean }
  | { type: 'reset'; values?: CheckoutValues };

export const DEMO_DECLINED = 'Demo: the payment was declined. Nothing was charged. Try again or choose another payment method.';

export const initialCheckoutState = (values: CheckoutValues = emptyCheckoutValues()): DemoCheckoutState => ({ values, step: 'information', errors: {}, status: 'idle', lastOrder: null, placed: 0 });

export function checkoutReducer(state: DemoCheckoutState, action: DemoCheckoutAction): DemoCheckoutState {
  switch (action.type) {
    case 'change':
      return { ...state, values: action.values, status: state.status === 'error' ? 'idle' : state.status };
    case 'goTo':
      // Only steps whose earlier steps are valid can be entered (back is always fine).
      return canEnterStep(action.step, state.values, action.flags) ? { ...state, step: action.step, errors: {} } : state;
    case 'placeOrder': {
      const invalid = firstInvalidStep(state.values, action.flags);
      if (invalid) return { ...state, step: invalid.step, errors: invalid.errors, status: 'idle' };
      if (action.cart.lines.length === 0) return { ...state, status: 'error', errorMessage: 'Your cart is empty.' };
      if (action.fail) return { ...state, status: 'error', errorMessage: DEMO_DECLINED };
      const order = createOrderFromCart(action.cart, state.values, orderContext(2101 + state.placed));
      return { ...state, status: 'idle', errorMessage: undefined, errors: {}, lastOrder: order, placed: state.placed + 1 };
    }
    case 'reset':
      return { ...initialCheckoutState(action.values), placed: state.placed };
  }
}
