/* DEMO ONLY. Storybook decorator that wraps a story in DemoCommerceProvider. */
import type { Decorator } from '@storybook/react-vite';
import type { CartFixtureKey } from '../../src/commerce/fixtures';
import { DemoCommerceProvider } from './DemoCommerceProvider';

/**
 * `decorators: [withDemoCommerce('mixed')]`. A story can override the cart with
 * `parameters: { demoCommerce: { cart: 'digitalOnly' } }`.
 */
export function withDemoCommerce(initialCart?: CartFixtureKey): Decorator {
  return (Story, { parameters, id }) => {
    const cart = (parameters.demoCommerce as { cart?: CartFixtureKey } | undefined)?.cart ?? initialCart ?? 'empty';
    return (
      // Keyed by story and cart so switching stories starts from a fresh cart.
      <DemoCommerceProvider key={`${id}-${cart}`} initialCart={cart}>
        <Story />
      </DemoCommerceProvider>
    );
  };
}
