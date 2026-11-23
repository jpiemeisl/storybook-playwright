/*
 * Headless variant selection. Framework-free and pure; useVariantSelection wraps it for React.
 * A "selection" maps option names to chosen values and may be partial.
 */
import type { Product, Variant } from '../types/product';

/** Chosen option values keyed by option name (e.g. `{ Color: 'Blue', Size: 'M' }`); may be partial. */
export type Selection = Record<string, string>;

/** in-stock: leads to a purchasable variant (in stock, low stock, backorder or pre-order). out-of-stock: only sold-out variants. none: no variant has it. */
export type OptionAvailability = 'in-stock' | 'out-of-stock' | 'none';

/** Purchasable now (out-of-stock is the only status that cannot be bought). */
export const isPurchasable = (variant: Variant) => variant.stock.status !== 'out-of-stock';

const matches = (variant: Variant, selection: Selection) =>
  Object.entries(selection).every(([name, value]) => variant.optionValues[name] === value);

/** The variant matching a complete selection; the single variant of a product without options. */
export function resolveVariant(product: Product, selection: Selection): Variant | undefined {
  if (product.options.length === 0) return product.variants[0];
  if (product.options.some((option) => selection[option.name] === undefined)) return undefined;
  return product.variants.find((variant) => matches(variant, selection));
}

/**
 * For each option value: what selecting it (keeping the other current selections) leads to.
 * With a partial selection, any variant compatible with the chosen values counts.
 */
export function getOptionAvailability(product: Product, selection: Selection): Record<string, Record<string, OptionAvailability>> {
  const result: Record<string, Record<string, OptionAvailability>> = {};
  for (const option of product.options) {
    result[option.name] = {};
    for (const value of option.values) {
      const candidates = product.variants.filter((variant) => matches(variant, { ...selection, [option.name]: value }));
      result[option.name]![value] = candidates.some(isPurchasable) ? 'in-stock' : candidates.length > 0 ? 'out-of-stock' : 'none';
    }
  }
  return result;
}

/** The first purchasable variant's values (else the first variant's); {} for products without options. */
export function defaultSelection(product: Product): Selection {
  if (product.options.length === 0) return {};
  const variant = product.variants.find(isPurchasable) ?? product.variants[0];
  return variant ? { ...variant.optionValues } : {};
}

/**
 * The selection after choosing `value` for `name`. If that combination does not exist, keeps the new
 * value and switches the other options to the closest existing variant (purchasable first, then the
 * one sharing most of the previous values).
 */
export function selectOption(product: Product, selection: Selection, name: string, value: string): Selection {
  const next = { ...selection, [name]: value };
  if (product.variants.some((variant) => matches(variant, next) && Object.keys(variant.optionValues).length === Object.keys(next).length)) return next;
  const withValue = product.variants.filter((variant) => variant.optionValues[name] === value);
  if (withValue.length === 0) return next;
  const shared = (variant: Variant) => Object.entries(selection).filter(([key, v]) => variant.optionValues[key] === v).length;
  const best = [...withValue].sort((a, b) => Number(isPurchasable(b)) - Number(isPurchasable(a)) || shared(b) - shared(a))[0]!;
  return { ...best.optionValues };
}
