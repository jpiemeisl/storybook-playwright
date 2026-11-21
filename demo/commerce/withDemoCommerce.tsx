/* DEMO ONLY. Storybook decorator that wraps a story in DemoCommerceProvider. */
import type { Decorator } from '@storybook/react-vite';
import { checkoutValues, type CartFixtureKey } from '../../src/commerce/fixtures';
import { DemoCommerceProvider } from './DemoCommerceProvider';

/**
 * `decorators: [withDemoCommerce('mixed')]`. A story can override the cart with
 * `parameters: { demoCommerce: { cart: 'digitalOnly', checkout: 'digital' } }` (checkout: a checkoutValues
 * fixture key). `parameters: { demo: { failPlaceOrder: true } }` makes placing the order fail.
 */
export function withDemoCommerce(initialCart?: CartFixtureKey): Decorator {
  return (Story, { parameters, id }) => {
    const options = (parameters.demoCommerce as { cart?: CartFixtureKey; checkout?: keyof typeof checkoutValues } | undefined) ?? {};
    const cart = options.cart ?? initialCart ?? 'empty';
    const fail = !!(parameters.demo as { failPlaceOrder?: boolean } | undefined)?.failPlaceOrder;
    return (
      // Keyed by story and cart so switching stories starts from a fresh cart.
      <DemoCommerceProvider key={`${id}-${cart}`} initialCart={cart} initialCheckout={options.checkout ? checkoutValues[options.checkout] : undefined} failPlaceOrder={fail}>
        <Story />
      </DemoCommerceProvider>
    );
  };
}
