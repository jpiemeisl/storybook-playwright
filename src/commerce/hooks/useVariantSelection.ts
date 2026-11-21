import { useCallback, useMemo, useState } from 'react';
import type { Product } from '../types/product';
import { defaultSelection, getOptionAvailability, resolveVariant, selectOption, type Selection } from '../logic/variants';

/** Variant selection state for a product: thin wrapper over the pure helpers. */
export function useVariantSelection(product: Product, initial?: Selection) {
  const [selection, setSelection] = useState<Selection>(() => initial ?? defaultSelection(product));
  const select = useCallback((name: string, value: string) => setSelection((current) => selectOption(product, current, name, value)), [product]);
  const variant = useMemo(() => resolveVariant(product, selection), [product, selection]);
  const availability = useMemo(() => getOptionAvailability(product, selection), [product, selection]);
  return { selection, select, variant, availability, setSelection };
}
