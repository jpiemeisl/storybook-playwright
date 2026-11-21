import { describe, expect, it } from 'vitest';
import type { Product, Variant } from '../types/product';
import { defaultSelection, getOptionAvailability, resolveVariant, selectOption } from './variants';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const variant = (id: string, optionValues: Record<string, string>, status: Variant['stock']['status'] = 'in-stock'): Variant => ({ id, title: id, optionValues, price: usd(1000), stock: { status } });
const product = (options: Product['options'], variants: Variant[]): Product => ({
  id: 'p', handle: 'p', kind: 'physical', title: 'P', description: { format: 'html', html: '' }, images: [], options, variants, purchaseOptions: [{ type: 'one-time' }],
});

const tee = product(
  [{ name: 'Size', values: ['S', 'M', 'L', 'XL'] }, { name: 'Colour', values: ['Moss', 'Sand'] }],
  [variant('s-moss', { Size: 'S', Colour: 'Moss' }, 'out-of-stock'), variant('s-sand', { Size: 'S', Colour: 'Sand' }), variant('m-moss', { Size: 'M', Colour: 'Moss' }), variant('m-sand', { Size: 'M', Colour: 'Sand' }, 'out-of-stock'), variant('l-moss', { Size: 'L', Colour: 'Moss' }, 'backorder')],
);

describe('resolveVariant', () => {
  it('finds the variant for a complete selection only', () => {
    expect(resolveVariant(tee, { Size: 'M', Colour: 'Moss' })?.id).toBe('m-moss');
    expect(resolveVariant(tee, { Size: 'M' })).toBeUndefined();
    expect(resolveVariant(tee, { Size: 'L', Colour: 'Sand' })).toBeUndefined();
  });

  it('returns the single default variant of a product with no options', () => {
    const simple = product([], [variant('default', {})]);
    expect(resolveVariant(simple, {})?.id).toBe('default');
    expect(defaultSelection(simple)).toEqual({});
    expect(getOptionAvailability(simple, {})).toEqual({});
  });
});

describe('getOptionAvailability', () => {
  it('reports in-stock, out-of-stock and non-existent values given the other selections', () => {
    const availability = getOptionAvailability(tee, { Size: 'S', Colour: 'Moss' });
    expect(availability.Size).toEqual({ S: 'out-of-stock', M: 'in-stock', L: 'in-stock', XL: 'none' }); // L/Moss is backorder: purchasable
    expect(availability.Colour).toEqual({ Moss: 'out-of-stock', Sand: 'in-stock' });
  });

  it('with a partial selection, any compatible variant counts', () => {
    expect(getOptionAvailability(tee, {}).Size).toEqual({ S: 'in-stock', M: 'in-stock', L: 'in-stock', XL: 'none' });
  });

  it('all-unavailable product', () => {
    const soldOut = product([{ name: 'Size', values: ['S', 'M'] }], [variant('s', { Size: 'S' }, 'out-of-stock'), variant('m', { Size: 'M' }, 'out-of-stock')]);
    expect(getOptionAvailability(soldOut, {}).Size).toEqual({ S: 'out-of-stock', M: 'out-of-stock' });
    expect(defaultSelection(soldOut)).toEqual({ Size: 'S' });
  });
});

describe('defaultSelection and selectOption', () => {
  it('prefers the first purchasable variant', () => {
    expect(defaultSelection(tee)).toEqual({ Size: 'S', Colour: 'Sand' });
  });

  it('keeps a valid combination, otherwise moves to the closest existing variant', () => {
    expect(selectOption(tee, { Size: 'S', Colour: 'Sand' }, 'Size', 'M')).toEqual({ Size: 'M', Colour: 'Sand' });
    expect(selectOption(tee, { Size: 'S', Colour: 'Sand' }, 'Size', 'L')).toEqual({ Size: 'L', Colour: 'Moss' });
    expect(selectOption(tee, { Size: 'S', Colour: 'Sand' }, 'Size', 'XL')).toEqual({ Size: 'XL', Colour: 'Sand' });
  });

  it('handles 40 variants', () => {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
    const colours = ['Ink', 'Moss', 'Sand', 'Rust', 'Fog'];
    const variants = sizes.flatMap((size, i) => colours.map((colour, j) => variant(`${size}-${colour}`, { Size: size, Colour: colour }, (i + j) % 7 === 0 ? 'out-of-stock' : 'in-stock')));
    const big = product([{ name: 'Size', values: sizes }, { name: 'Colour', values: colours }], variants);
    expect(big.variants).toHaveLength(40);
    expect(defaultSelection(big)).toEqual({ Size: 'XS', Colour: 'Moss' });
    expect(resolveVariant(big, { Size: '4XL', Colour: 'Fog' })?.id).toBe('4XL-Fog');
    const availability = getOptionAvailability(big, { Size: 'XS', Colour: 'Ink' });
    expect(availability.Size!.XS).toBe('out-of-stock');
    expect(Object.values(availability.Colour!).filter((a) => a === 'in-stock')).toHaveLength(4);
  });
});
