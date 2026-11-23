# Commerce: product browsing

This guide covers collection listings (filters, facets, sorting, pagination) and the product page. The
overview is in [commerce.md](commerce.md). Everything lives in [`src/commerce`](../src/commerce), and the
core library never imports it (`npm run check:boundaries`). There is no backend: the templates take data
and call back.

## Filter state and URL format

`FilterState` (in `src/commerce/logic/browse.ts`):

```ts
{ kinds: ProductKind[]; tags: string[]; price?: { min?: number; max?: number }; options: Record<string, string[]>;
  availability: 'all' | 'in-stock'; onSale: boolean; minRating?: number; query?: string }
```

`parseFilters(query)` and `serializeFilters(state, { sort, page })` convert between the state and a query
string; `parseSort(query)` and `parsePage(query)` read the other two parameters. The rules:

- The key order is stable and values are sorted, so URLs and screenshots are deterministic.
- Defaults are omitted.
- Repeated keys carry several values. That is exactly what a native GET form with checkboxes sends, so `FilterPanel` works without JavaScript.
- Unknown or malformed parameters are ignored, numbers are clamped and values de-duplicated. Values longer than 80 characters are dropped.

| Parameter | Example | Meaning |
| --- | --- | --- |
| `q` | `q=mug` | Search text (title, summary, brand, tags), case-insensitive. Max 100 characters. |
| `kind` | `kind=digital&kind=physical` | Product kinds: `physical`, `digital`, `subscription`. |
| `tag` | `tag=kitchen` | Product tags (any match). |
| `o.<Option>` | `o.Size=M&o.Colour=Moss` | Option values, all matched on one variant. Option names are case-sensitive; `+` or `%20` encode spaces. |
| `price_min`, `price_max` | `price_min=20&price_max=49.50` | **Major currency units** (dollars, decimals allowed) in the URL, minor units in the state. Clamped to 0 or more. |
| `in_stock` | `in_stock=1` | Only products with a purchasable matching variant (in stock, low stock, backorder or pre-order). |
| `on_sale` | `on_sale=1` | Only products with a compare-at price. |
| `rating` | `rating=4` | Minimum average rating, whole stars 1-5. Products without reviews are excluded. |
| `sort` | `sort=price-asc` | `featured` (default, omitted), `price-asc`, `price-desc`, `newest`, `rating`, `title`. |
| `page` | `page=2` | 1-based page (default 1, omitted). |

**Facets are disjunctive.** `computeFacets(products, state)` counts the kind, tag and option groups as if
that group's own selection were cleared. Choosing "Moss" therefore still shows how many "Sand" products
there are. `describeFilters(state, { baseHref, sort })` returns the active filter chips with remove links.
`buildCollectionListing(products, request)` does filter, sort, facets and pagination in one call (12 per
page by default).

## Wiring the templates to a host app

The templates are registry entries. The core registry doesn't know about them; merge them in:

```tsx check
import { PageRenderer, createTemplates, type BreadcrumbItem, type SiteChrome } from '@jpiemeisl/pattern-library';
import { buildCollectionListing, commerceTemplates, parseFilters, parsePage, parseSort, type CollectionPage, type CommerceContext, type Product } from '@jpiemeisl/pattern-library/commerce';

const templates = createTemplates(Object.values(commerceTemplates));

interface CollectionRouteProps {
  collection: { id: string; handle: string; title: string };
  products: Product[];
  /** The request's query string. */
  search: string;
  breadcrumbs: BreadcrumbItem[];
  chrome: SiteChrome;
}

// Collection route, for example /shop/<handle>?<query>
export function CollectionRoute({ collection, products, search, breadcrumbs, chrome }: CollectionRouteProps) {
  const basePath = `/shop/${collection.handle}`;
  const listing = buildCollectionListing(products, { filters: parseFilters(search), sort: parseSort(search), page: parsePage(search), basePath });
  const page: CollectionPage = {
    id: collection.id,
    slug: `shop/${collection.handle}`,
    template: 'collection',
    seo: { title: collection.title },
    blocks: [],
    collection: { title: collection.title, breadcrumbs },
    listing,
  };
  const ctx: CommerceContext = { currentPath: basePath, productHref: (product) => `/products/${product.handle}` };
  return <PageRenderer page={page} chrome={chrome} templates={templates} ctx={ctx} />;
}
```

- **Without `ctx.onListingChange`:** filters, sort, chips and pagination are plain links and GET forms. The server re-renders from the query string. This works without JavaScript. Because a select can't submit on change without JavaScript, the sort control sits in its own small GET form with a "Sort" button that repeats the current filters as hidden fields.
- **With `ctx.onListingChange({ filters, sort, page })`:** everything is live. Update your URL (for example `router.replace('?' + serializeFilters(filters, { sort, page }))`), rebuild the listing, and pass the new page in.
- **Load-more mode:** `listing.mode = 'load-more'`. Pass `ctx.onLoadMore`; the "Load more" link also has a real `href` to the next page. `ctx.loading` shows skeletons in the grid.
- **Narrow containers:** the filters move into `FilterDrawer` (a button and a dialog); on wide containers the template shows the same `FilterPanel` in its sidebar. Only one of the two exists at a time.
- **Product page:** pass `{ template: 'product-detail', product, reviews, related, breadcrumbs?, initialSelection?, initialPurchaseOption? }`.
  - The template keeps the selection itself.
  - `ctx.onSelectionChange(selection)` lets you sync the URL if you want to. URL syncing is the host's job.
  - `ctx.onAddToCart({ product, variantId, quantity, purchaseOption })` adds to your cart. Return a promise to get the loading, success and error states on the button.
  - `ctx.onQuickAdd(product, variant)` powers the "Add to cart" button on cards (collection grid, related products, cross-sell and wishlist). Only single-variant, purchasable physical and digital products get the button; products with several variants or purchase options show a "Choose options" cue under the title link instead.
  - The wishlist button on the product page keeps its state locally; there is no context callback for it yet.
- **Links** go through `Link`/`LinkProvider`, so Next.js or React Router links work. The "Browse flow" story (`Demo/Product browsing`) shows a LinkProvider that maps links to state.
- **Validation:** `validateCollectionPage(page)` and `validateProductPage(page)` check the page data: pagination sanity, initial selection and purchase option exist, unsafe links and image sources, and everything the product and reviews validators check.

## Product data for the product page

Beyond the core product fields, these drive the product page and listings:

- `ProductOption.display?: 'buttons' | 'swatches' | 'select'` and `swatches?: Record<value, cssColor>`.
  - Swatches always show the value text too.
  - Options with 12 or more values default to `select`.
- `Product.infoSections?: { id, title, content: RichText }[]` (shown in an accordion) and `Product.sizeGuide?: TableData` (opened from the variant selector).
  - The commerce `TableData` is the JSON `caption`/`columns`/`rows` shape of the content model's `table` block. The core component's `TableData` holds React nodes, so it can't be JSON.
- `Product.createdAt?` (ISO date), for the "newest" sort.
- `Collection.image?`, for tiles.
- `ProductReviewsData { summary: { average, count, distribution }, reviews }`. `summarizeReviews(reviews)` builds the summary, and `validateReviewsData` checks that the distribution adds up. `ReviewSummary` takes an `action` slot (for example a "Write a review" link); there is no review form.
- **Page shapes:** `CollectionPage`, `ProductPage` and `CollectionListing` (in `src/commerce/types/pages.ts`).

## Sticky add-to-cart bar

Below 48rem, while the product page's real AddToCart is scrolled out of view, `StickyBuyBar` pins the
title, price and the **same** AddToCart (with `secondary`: same label, status and disabled behavior, no
second live region) to the bottom of the viewport. `useOutOfView` tracks "out of view" with an
IntersectionObserver in an effect; where it isn't supported the bar never appears. When the product can't
be added (sold out, or no complete selection), the bar shows the status text instead of a button.

While the bar shows, `html` gets `scroll-padding-block-end` and matching end padding, so focused controls
and the last links on the page stay clear of it. It respects the bottom safe-area inset, sits below toasts
and the cookie banner (`--z-sticky-bar`), and never prints.

## Limitations

- **URL price filters assume two decimals.** `price_min=20` means 2000 minor units. That is right for the
  USD demo catalog, but not for currencies with zero or three decimals (JPY, KWD).
- **No price range slider:** the price filter is two number inputs.
- **No review submission form.**
