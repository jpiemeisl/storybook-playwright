/*
 * Story-only helpers for the commerce templates: a live collection wrapper (pure logic, no network)
 * and page-level assertions. Not exported from the commerce barrel.
 */
import { useMemo, useState } from 'react';
import { expect } from 'storybook/test';
import { chrome, listingCollections, type ListingCollectionKey } from '../fixtures';
import { emptyFilters, type FilterState, type SortKey } from '../logic/browse';
import { buildCollectionListing } from '../logic/collection';
import { CollectionTemplate } from '../templates';
import type { CommerceContext } from '../types/context';
import type { CollectionPage } from '../types/pages';
import { collectionPage } from '../fixtures';

/** Exactly one h1, no skipped heading levels (headings inside closed dialogs ignored). */
export async function expectHeadingOutline(root: HTMLElement) {
  const levels = [...root.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => !h.closest('dialog:not([open])')).map((h) => Number(h.tagName[1]));
  await expect(levels.filter((l) => l === 1)).toHaveLength(1);
  await expect(levels.flatMap((l, i) => (i > 0 && l > levels[i - 1]! + 1 ? [`h${levels[i - 1]} → h${l}`] : []))).toEqual([]);
}

/** A collection page whose filters, sort and load-more run through buildCollectionListing in memory. */
export function LiveCollection({ collection, initial, mode = 'pages', ctx }: { collection: ListingCollectionKey; initial?: Partial<{ filters: FilterState; sort: SortKey }>; mode?: 'pages' | 'load-more'; ctx?: CommerceContext }) {
  const source = listingCollections[collection];
  const [request, setRequest] = useState({ filters: initial?.filters ?? emptyFilters(), sort: initial?.sort ?? ('featured' as SortKey), page: 1 });
  const page = useMemo<CollectionPage>(() => {
    const base = collectionPage(collection, '', { mode });
    return { ...base, listing: buildCollectionListing(source.products, { ...request, mode, basePath: source.basePath }) };
  }, [collection, mode, request, source]);
  const context = useMemo<CommerceContext>(
    () => ({
      currentPath: source.basePath,
      ...ctx,
      onListingChange: (change) => setRequest(change),
      onLoadMore: () => setRequest((r) => ({ ...r, page: r.page + 1 })),
    }),
    [ctx, source.basePath],
  );
  return <CollectionTemplate page={page} chrome={chrome} ctx={context} />;
}
