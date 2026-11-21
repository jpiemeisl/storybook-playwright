# Commerce: product browsing

Phase 10 (hand-written). Everything lives in [`src/commerce`](../src/commerce), and the core library never imports it (`npm run check:boundaries`). There is no backend: the templates take data and call back.

## Filter state and URL format

`FilterState` (in `src/commerce/logic/browse.ts`):

```ts
{ kinds: ProductKind[]; tags: string[]; price?: { min?: number; max?: number }; options: Record<string, string[]>;
  availability: 'all' | 'in-stock'; onSale: boolean; minRating?: number; query?: string }
```

`parseFilters(query)` and `serializeFilters(state, { sort, page })` convert between the state and a query string. The rules:

- The key order is stable and values are sorted, so URLs and screenshots are deterministic.
- Defaults are omitted.
- Repeated keys carry several values. That is exactly what a native GET form with checkboxes sends, so `FilterPanel` works without JavaScript.
- Unknown or malformed parameters are ignored, numbers are clamped and values de-duplicated.

| Parameter | Example | Meaning |
| --- | --- | --- |
| `q` | `q=mug` | Search text (title, summary, brand, tags), case-insensitive. Max 100 characters. |
| `kind` | `kind=digital&kind=physical` | Product kinds: `physical`, `digital`, `subscription`. |
| `tag` | `tag=kitchen` | Product tags (any match). |
| `o.<Option>` | `o.Size=M&o.Colour=Moss` | Option values, matched on one variant. Option names are case-sensitive; `+` or `%20` encode spaces. |
| `price_min`, `price_max` | `price_min=20&price_max=49.50` | **Whole currency units** in the URL (minor units in the state). Clamped to 0 or more. |
| `in_stock` | `in_stock=1` | Only products with a purchasable matching variant (in stock, low, backorder or pre-order). |
| `on_sale` | `on_sale=1` | Only products with a compare-at price. |
| `rating` | `rating=4` | Minimum average rating, whole stars 1-5. Products without reviews are excluded. |
| `sort` | `sort=price-asc` | `featured` (default, omitted), `price-asc`, `price-desc`, `newest`, `rating`, `title`. |
| `page` | `page=2` | 1-based page (default 1, omitted). |

**Facets are disjunctive.** `computeFacets(products, state)` counts each group as if that group's own selection were cleared. Choosing "Moss" therefore still shows how many "Sand" products there are. `describeFilters(state, { baseHref, sort })` returns the active filter chips with remove links. `buildCollectionListing(products, request)` does filter, sort, facets and pagination in one call.

## Wiring the templates to a host app

The templates are registry entries. The core registry doesn't know about them; merge them in:

```tsx
import { createTemplates, PageRenderer } from 'storybook-playwright';
import { buildCollectionListing, commerceTemplates, parseFilters, parsePage, parseSort } from 'storybook-playwright/commerce'; // src/commerce

const templates = createTemplates(Object.values(commerceTemplates));

// Collection route, e.g. /shop/[collection]?query
function CollectionRoute({ collection, products, search }) {
  const listing = buildCollectionListing(products, { filters: parseFilters(search), sort: parseSort(search), page: parsePage(search), basePath: `/shop/${collection.handle}` });
  const page = { id: collection.id, slug: `shop/${collection.handle}`, template: 'collection', seo: { title: collection.title }, blocks: [], collection: { title: collection.title, breadcrumbs }, listing };
  return <PageRenderer page={page} chrome={chrome} templates={templates} ctx={{ currentPath, productHref: (p) => `/products/${p.handle}` }} />;
}
```

- **Without `ctx.onListingChange`:** filters, sort, chips and pagination are plain links and GET forms. The server re-renders from the query string. This works without JavaScript.
- **With `ctx.onListingChange({ filters, sort, page })`:** everything is live. Update your URL (for example `router.replace('?' + serializeFilters(filters, { sort, page }))`), rebuild the listing, and pass the new page in.
- **Load-more mode:** `listing.mode = 'load-more'`. Pass `ctx.onLoadMore`; the "Load more" link also has a real `href` to the next page.
- **Product page:** pass `{ template: 'product-detail', product, reviews, related, breadcrumbs, initialSelection?, initialPurchaseOption? }`.
  - The template keeps the selection itself.
  - `ctx.onSelectionChange(selection)` lets you sync the URL if you want to. URL syncing is the host's job, by design.
  - `ctx.onAddToCart({ product, variantId, quantity, purchaseOption })` adds to your cart. Return a promise to get the loading, success and error states on the button.
  - `ctx.onQuickAdd(product, variant)` powers the quick add on cards.
- **Links** go through `Link`/`LinkProvider`, so Next.js or React Router links work. The "Browse flow" story in `demo/` shows a LinkProvider that maps links to state.
- **Validation:** `validateCollectionPage(page)` and `validateProductPage(page)` check the page data: pagination sanity, initial selection and purchase option exist, unsafe links, and everything the product and reviews validators check.

## Type changes (additive)

- `ProductOption.display?: 'buttons' | 'swatches' | 'select'` and `swatches?: Record<value, cssColour>`.
  - Swatches always show the value text too.
  - Options with 12 or more values default to `select`.
- `Product.infoSections?: { id, title, content: RichText }[]` and `Product.sizeGuide?: TableData`.
  - `TableData` is the JSON `caption`/`columns`/`rows` shape of the content model's `table` block. The core component `TableData` holds React nodes, so it can't be JSON.
- `Product.createdAt?` (ISO date), for the "newest" sort.
- `Collection.image?`, for tiles.
- `ProductReviewsData { summary: { average, count, distribution }, reviews }`. `summarizeReviews(reviews)` builds the summary, and `validateReviewsData` checks that the distribution adds up.
- **Page shapes:** `CollectionPage`, `ProductPage` and `CollectionListing`.
- **`CommerceContext`:** extends the core `RenderContext` with the commerce callbacks.

## Gap report

What the library lacked and how it was filled:

- **Icons:** `heart`, `heart-filled`, `filter`, `sort`, `truck`, `refresh`, `shield`, `ruler`. Already there: `download`, `minus`, `plus`, stars, `repeat`.
- **No new tokens.** Sale, rating, warning, success and info colours already covered the badges and callouts.
- **New commerce components:**
  - listing: ProductCard and ProductCardSkeleton, ProductGrid, CollectionCard, LoadMore, SortSelect
  - filtering: FilterPanel, ActiveFilters, FilterDrawer
  - product page: ProductGallery, VariantSelector, SizeGuide, PurchaseOptionSelector and BillingIntervalSelector, QuantityStepper, AddToCart, WishlistButton
  - product details: DeliveryInfo and TrialBanner, DigitalDetails, ProductInfoAccordion
  - reviews and related: ReviewSummary and ReviewList, RelatedProducts
- **Reused, not reimplemented:**
  - controls: Button, Field, Input, Select, Checkbox, RadioGroup (the card variant for purchase options)
  - containers: Accordion, Modal, Carousel, Lightbox, Table
  - navigation and states: Pagination, Breadcrumbs, Badge, EmptyState (already in core since Phase 8)
  - layout: PageHeader, Container, Section, Grid, SiteLayout and PageSection

### Composition decisions to review

1. **"Choose options" on cards is a visual cue, not a second link.**
   - The brief asked for a plain link, and also for exactly one link per card. A second link to the same page is redundant for keyboard and screen reader users, so the cue sits under the card's stretched title link.
   - It is shown only for products with several variants or purchase options.
   - Quick add is a real, separate button: "Add to cart", named "Add to cart: <title>".
2. **Option chips and swatches in FilterPanel, and values in VariantSelector,** are native inputs, visually hidden, inside styled labels. The checked state is a thicker border plus a tick (never colour alone), and forced colours map the border to `Highlight`. VariantSelector puts the state ("sold out", "not available with the other options chosen") in each radio's own `aria-label`. Visually hidden text inside the label was joined into the name with an extra space.
3. **FilterDrawer** renders only the button and the dialog. On wide containers, the template shows the same FilterPanel inline in its sidebar, so the drawer and the sidebar never both exist.
4. **No-JavaScript sort.** Without live mode, the collection toolbar wraps SortSelect in its own small GET form. That form repeats the current filters as hidden fields and has a "Sort" button. A select can't submit on change without JavaScript.
5. **AddToCart disabled states** use `aria-disabled` (still focusable) plus a visible reason linked with `aria-describedby`, not the `disabled` attribute.
6. **ReviewSummary bars** are decorative `aria-hidden` spans; the counts are text in the same list item. I used no `<meter>`, because the bars only repeat the text.
7. **Gallery breakpoint.** The gallery switches between its thumbnail layout and the scroll-snap strip at a 28rem container width. The strip is keyboard-scrollable (`tabIndex=0`).
8. **Prices in the URL** are whole currency units with two decimals assumed: the demo catalogue is USD.

### Deferred

- **Sticky mobile add-to-cart bar:** not shipped. Doing it properly needs the bar to appear only once the real button scrolls out of view (an IntersectionObserver), plus scroll padding. That's more than "simple"; the Landing template's StickyActionBar is the pattern to reuse later.
- **Price range slider:** two number inputs instead, as the brief asked.
- **URL syncing** inside the templates: by design, the host does it.
- **Review submission:** `ReviewSummary` takes an `action` slot for a "Write a review" link; there is no form.
