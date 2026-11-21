/*
 * Commerce foundations. Separate from the core library: nothing outside src/commerce (and the
 * Storybook-only demo/) may import from here; `npm run check:boundaries` enforces it.
 */
export type * from './types';
export * from './logic/money';
export * from './logic/pricing';
export * from './logic/cart';
export * from './logic/variants';
export { useVariantSelection } from './hooks/useVariantSelection';
export * from './logic/validate';
export * from './components/Price';
export * from './components/SaleBadge';
export * from './components/StockBadge';
export * from './components/ProductTypeBadge';
export * from './components/Rating';
