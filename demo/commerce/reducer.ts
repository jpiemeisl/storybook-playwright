/*
 * DEMO ONLY: in-memory cart reducer for Storybook. Pure; line ids come from a counter in state, never
 * from the clock or randomness.
 */
import { cartLineFromProduct, sameLine } from '../../src/commerce/logic/lines';
import type { Cart, CartLine, Product, PromoCode, PurchaseOption } from '../../src/commerce';

export const MAX_QUANTITY = 99;

export type DemoAction =
  | { type: 'addLine'; product: Product; variantId: string; quantity?: number; purchaseOption?: PurchaseOption }
  | { type: 'removeLine'; lineId: string }
  | { type: 'setQuantity'; lineId: string; quantity: number }
  | { type: 'setPurchaseOption'; lineId: string; purchaseOption: PurchaseOption }
  | { type: 'applyPromo'; code: string }
  | { type: 'removePromo'; code: string }
  | { type: 'setShippingMethod'; methodId: string | undefined }
  | { type: 'clear' }
  | { type: 'replaceCart'; cart: Cart };

export interface DemoState {
  cart: Cart;
  /** The most recent action and what it did, for toasts later. */
  lastAction: { type: DemoAction['type']; ok: boolean; message: string } | null;
  /** Newest last, capped at 50 entries. For debugging. */
  log: string[];
  /** Next line number (line ids are "line-<n>"). */
  nextLine: number;
}

export type PromoResult = { ok: true; code: string; message: string } | { ok: false; reason: 'empty' | 'unknown' | 'duplicate'; message: string };

/** Checks a promo code against the definitions (case-insensitive) and the codes already applied. */
export function checkPromo(cart: Cart, entered: string, definitions: readonly PromoCode[]): PromoResult {
  const code = entered.trim().toUpperCase();
  if (!code) return { ok: false, reason: 'empty', message: 'Enter a promo code.' };
  const definition = definitions.find((d) => d.code.toUpperCase() === code);
  if (!definition) return { ok: false, reason: 'unknown', message: `"${entered.trim()}" is not a valid code.` };
  if (cart.promoCodes.some((c) => c.toUpperCase() === code)) return { ok: false, reason: 'duplicate', message: `${definition.code} is already applied.` };
  return { ok: true, code: definition.code, message: `${definition.code} applied: ${definition.description}.` };
}

const clampQuantity = (quantity: number) => Math.min(MAX_QUANTITY, Math.max(0, Math.floor(quantity)));
const highestLineNumber = (lines: CartLine[]) => lines.reduce((n, l) => Math.max(n, Number(/(\d+)$/.exec(l.id)?.[1] ?? 0)), 0);

export function initialDemoState(cart: Cart): DemoState {
  return { cart: structuredClone(cart), lastAction: null, log: [], nextLine: highestLineNumber(cart.lines) + 1 };
}

/** Reducer with the promo definitions bound in (they validate applyPromo). */
export function createDemoReducer(promoDefinitions: readonly PromoCode[]) {
  return function demoReducer(state: DemoState, action: DemoAction): DemoState {
    const done = (cart: Cart, ok: boolean, message: string, nextLine = state.nextLine): DemoState => ({
      cart,
      nextLine,
      lastAction: { type: action.type, ok, message },
      log: [...state.log, `${action.type}: ${message}`].slice(-50),
    });
    const { cart } = state;
    const withLines = (lines: CartLine[]): Cart => ({ ...cart, lines });

    switch (action.type) {
      case 'addLine': {
        const quantity = clampQuantity(action.quantity ?? 1);
        if (quantity < 1) return done(cart, false, 'Quantity must be at least 1.');
        const candidate = cartLineFromProduct(action.product, action.variantId, quantity, `line-${state.nextLine}`, action.purchaseOption);
        if (!candidate) return done(cart, false, `No variant ${action.variantId} on ${action.product.title}.`);
        const existing = cart.lines.find((line) => sameLine(line, candidate));
        if (existing) {
          const merged = Math.min(MAX_QUANTITY, existing.quantity + quantity);
          return done(withLines(cart.lines.map((l) => (l === existing ? { ...l, quantity: merged } : l))), true, `${candidate.snapshot.title} quantity is now ${merged}.`);
        }
        return done(withLines([...cart.lines, candidate]), true, `Added ${candidate.snapshot.title}.`, state.nextLine + 1);
      }
      case 'removeLine': {
        const line = cart.lines.find((l) => l.id === action.lineId);
        if (!line) return done(cart, false, `No line ${action.lineId}.`);
        return done(withLines(cart.lines.filter((l) => l !== line)), true, `Removed ${line.snapshot.title}.`);
      }
      case 'setQuantity': {
        const line = cart.lines.find((l) => l.id === action.lineId);
        if (!line) return done(cart, false, `No line ${action.lineId}.`);
        const quantity = clampQuantity(action.quantity);
        if (quantity === 0) return done(withLines(cart.lines.filter((l) => l !== line)), true, `Removed ${line.snapshot.title}.`);
        return done(withLines(cart.lines.map((l) => (l === line ? { ...l, quantity } : l))), true, `${line.snapshot.title} quantity is now ${quantity}.`);
      }
      case 'setPurchaseOption': {
        const line = cart.lines.find((l) => l.id === action.lineId);
        if (!line) return done(cart, false, `No line ${action.lineId}.`);
        if (line.snapshot.kind === 'subscription' && action.purchaseOption.type !== 'subscription') return done(cart, false, 'Subscription products need a subscription option.');
        const updated = { ...line, purchaseOption: action.purchaseOption };
        const twin = cart.lines.find((l) => l !== line && sameLine(l, updated));
        const lines = twin
          ? cart.lines.filter((l) => l !== line).map((l) => (l === twin ? { ...l, quantity: Math.min(MAX_QUANTITY, l.quantity + line.quantity) } : l))
          : cart.lines.map((l) => (l === line ? updated : l));
        return done(withLines(lines), true, twin ? `Merged with the matching ${line.snapshot.title} line.` : `Changed how ${line.snapshot.title} is bought.`);
      }
      case 'applyPromo': {
        const result = checkPromo(cart, action.code, promoDefinitions);
        return result.ok ? done({ ...cart, promoCodes: [...cart.promoCodes, result.code] }, true, result.message) : done(cart, false, result.message);
      }
      case 'removePromo': {
        const code = action.code.trim().toUpperCase();
        const promoCodes = cart.promoCodes.filter((c) => c.toUpperCase() !== code);
        return done({ ...cart, promoCodes }, promoCodes.length !== cart.promoCodes.length, promoCodes.length !== cart.promoCodes.length ? `Removed ${action.code}.` : `${action.code} was not applied.`);
      }
      case 'setShippingMethod': {
        const { shippingMethodId: _previous, ...rest } = cart;
        return done(action.methodId ? { ...rest, shippingMethodId: action.methodId } : rest, true, action.methodId ? `Shipping method ${action.methodId}.` : 'Shipping method cleared.');
      }
      case 'clear':
        return done({ id: cart.id, currency: cart.currency, lines: [], promoCodes: [] }, true, 'Cart cleared.', 1);
      case 'replaceCart': {
        const next = structuredClone(action.cart);
        return done(next, true, `Loaded cart ${next.id}.`, highestLineNumber(next.lines) + 1);
      }
    }
  };
}
