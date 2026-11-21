import { useState } from 'react';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { Button } from '../../../components/Button';
import { Container } from '../../../components/Container';
import { EmptyState } from '../../../components/EmptyState';
import { Grid } from '../../../components/Grid';
import { Heading } from '../../../components/Heading';
import { PageHeader } from '../../../components/PageHeader';
import { Pagination } from '../../../components/Pagination';
import type { PageContent } from '../../../content-types/blocks';
import { isObj } from '../../../registry/checker';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import type { TemplateProps } from '../../../templates/types';
import { ActiveFilters } from '../../components/ActiveFilters';
import { CollectionCard } from '../../components/CollectionCard';
import { FilterDrawer } from '../../components/FilterDrawer';
import { FilterPanel } from '../../components/FilterPanel';
import { LoadMore } from '../../components/LoadMore';
import { ProductCard } from '../../components/ProductCard';
import { ProductGrid } from '../../components/ProductGrid';
import { SortSelect } from '../../components/SortSelect';
import { describeFilters, emptyFilters, removeFilter, serializeFilters, type FilterState, type SortKey } from '../../logic/browse';
import { defaultProductHref, type CommerceContext } from '../../types/context';
import type { CollectionPage } from '../../types/pages';
import styles from './CollectionTemplate.module.css';

export const canRenderCollection = (page: PageContent) => {
  const { collection, listing } = page as Partial<CollectionPage>;
  return isObj(collection) && isObj(listing) && Array.isArray(listing.products) && isObj(listing.facets);
};

/**
 * Collection listing: breadcrumbs, page header (h1), optional category tiles, a filter sidebar on wide
 * containers and a filter drawer on narrow ones, a toolbar (sort, filters), active filter chips, the
 * product grid, then pagination or "Load more". With ctx.onListingChange everything is live; without
 * it, filters are a GET form and chips and pages are links.
 */
export function CollectionTemplate({ page, chrome, ctx }: TemplateProps<CollectionPage> & { ctx?: CommerceContext }) {
  const { collection, listing, subCollections } = page;
  const { filters, sort, pagination } = listing;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const live = ctx?.onListingChange;
  const href = ctx?.productHref ?? defaultProductHref;
  const urlFor = (state: FilterState, nextSort: SortKey, nextPage = 1) => {
    const query = serializeFilters(state, { sort: nextSort, page: nextPage });
    return query ? `${pagination.basePath}?${query}` : pagination.basePath;
  };
  const change = (state: FilterState, nextSort = sort) => live?.({ filters: state, sort: nextSort, page: 1 });
  const chips = describeFilters(filters, { baseHref: pagination.basePath, sort });
  const filtered = chips.length > 0;
  const clear = () => change({ ...emptyFilters(), ...(filters.query ? { query: filters.query } : {}) });
  const panel = (id?: string) => <FilterPanel id={id} facets={listing.facets} value={filters} onChange={live ? change : undefined} action={pagination.basePath} sort={sort} />;

  const empty =
    !filtered && listing.total === 0 ? (
      <EmptyState title="This collection is empty" message="New products are on their way. In the meantime, browse everything in the shop." action={{ label: 'Browse all products', href: '/shop' }} />
    ) : (
      <EmptyState title="No products match your filters" message="Try removing a filter or widening the price range.">
        {live ? (
          <Button variant="secondary" onClick={clear}>
            Clear all filters
          </Button>
        ) : undefined}
      </EmptyState>
    );

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <div className={styles.root}>
            <PageHeader title={collection.title} description={collection.description} breadcrumbs={collection.breadcrumbs.length ? <Breadcrumbs items={collection.breadcrumbs} /> : undefined} headingLevel={1} />

            {subCollections?.length ? (
              <section aria-labelledby="sub-collections" className={styles.section}>
                <Heading as="h2" size="lg" id="sub-collections">
                  Shop by category
                </Heading>
                <Grid as="ul" columns={{ base: 2, md: 4 }} gap="md" className={styles.tiles}>
                  {subCollections.map((sub) => (
                    <li key={sub.href}>
                      <CollectionCard title={sub.title} href={sub.href} productCount={sub.productCount} image={sub.image} />
                    </li>
                  ))}
                </Grid>
              </section>
            ) : null}

            <div className={styles.layout}>
              <aside className={styles.sidebar} aria-label="Filters">
                {panel('collection-filters')}
              </aside>
              <section className={styles.main} aria-labelledby="products-heading">
                <Heading as="h2" size="lg" id="products-heading" className={styles.visuallyHidden}>
                  Products
                </Heading>
                <div className={styles.toolbar}>
                  <div className={styles.drawer}>
                    <FilterDrawer open={drawerOpen} onOpenChange={setDrawerOpen} activeCount={chips.length} resultCount={listing.total} onClear={live ? clear : undefined}>
                      {panel()}
                    </FilterDrawer>
                  </div>
                  {live ? (
                    <SortSelect value={sort} onChange={(next) => change(filters, next)} />
                  ) : (
                    <form method="get" action={pagination.basePath} className={styles.sortForm}>
                      {serializeFilters(filters)
                        .split('&')
                        .filter(Boolean)
                        .map((pair) => {
                          const [key, value] = pair.split('=').map((s) => decodeURIComponent(s.replace(/\+/g, ' ')));
                          return <input key={pair} type="hidden" name={key} value={value} />;
                        })}
                      <SortSelect value={sort} />
                      <Button type="submit" size="sm" variant="secondary">
                        Sort
                      </Button>
                    </form>
                  )}
                </div>
                <ActiveFilters filters={chips} onRemove={live ? (chip) => change(removeFilter(filters, chip.id)) : undefined} onClear={live ? clear : undefined} clearHref={urlFor(emptyFilters(), sort)} />
                <ProductGrid count={listing.total} loading={ctx?.loading} empty={empty}>
                  {listing.products.map((product) => (
                    <ProductCard key={product.id} product={product} href={href(product)} quickAction={ctx?.onQuickAdd ? 'add' : 'choose-options'} onQuickAdd={ctx?.onQuickAdd} />
                  ))}
                </ProductGrid>
                {listing.total > 0 &&
                  (listing.mode === 'load-more' ? (
                    <LoadMore shown={listing.products.length} total={listing.total} href={urlFor(filters, sort, pagination.currentPage + 1)} onLoadMore={ctx?.onLoadMore} loading={ctx?.loading} />
                  ) : (
                    <Pagination currentPage={pagination.currentPage} totalPages={pagination.totalPages} hrefBuilder={(n) => urlFor(filters, sort, n)} aria-label="Product pages" />
                  ))}
              </section>
            </div>
          </div>
        </Container>
      </PageSection>
    </SiteLayout>
  );
}
