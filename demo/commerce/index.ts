/* DEMO ONLY: never re-export this from anything under src/. */
export { DemoCommerceProvider, useDemoCart, useDemoCheckout, useDemoToasts, type DemoCart, type DemoCheckout, type DemoToasts } from './DemoCommerceProvider';
export { checkoutReducer, DEMO_DECLINED, initialCheckoutState, type DemoCheckoutAction, type DemoCheckoutState } from './checkoutReducer';
export { withDemoCommerce } from './withDemoCommerce';
export { checkPromo, createDemoReducer, initialDemoState, MAX_QUANTITY, type DemoAction, type DemoState, type PromoResult } from './reducer';
