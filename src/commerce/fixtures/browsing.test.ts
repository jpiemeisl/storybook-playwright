/*
 * Contract and behaviour tests for the browsing fixtures, page validators, review helpers and the
 * commerce templates registry merge.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createTemplates, defaultTemplates, getTemplate, resolveTemplate } from '../../templates/registry';
import { PageRenderer } from '../../templates/PageRenderer';
import { applyFilters, computeFacets, parseFilters } from '../logic/browse';
import { sortReviews, summarizeReviews } from '../logic/reviews';
import { validateProduct, validateReviewsData } from '../logic/validate';
import { validateCollectionPage, validateProductPage } from '../logic/validatePages';
import { commerceTemplates } from '../templates';
import { catalog, catalog48, chrome, club, coffee, collectionPage, filterQueries, generateCatalog, guide, listingCollections, plannerApp, productPage, reviewsData, reviewsForty, socks, subCollectionTiles, tee, type ListingCollectionKey } from './index';

const codes = (issues: { code: string; path: string }[]) => issues.map((i) => `${i.code}@${i.path}`);

describe('48-product catalogue', () => {
  it('is deterministic, has unique ids and handles, and validates', () => {
    expect(catalog48).toHaveLength(48);
    expect(generateCatalog()).toEqual(catalog48);
    expect(new Set(catalog48.map((p) => p.id)).size).toBe(48);
    expect(new Set(catalog48.map((p) => p.handle)).size).toBe(48);
    for (const product of catalog48) expect(validateProduct(product), product.id).toEqual([]);
  });
});

describe('reviews data', () => {
  it('summaries add up and validate', () => {
    for (const [name, data] of Object.entries(reviewsData)) expect(validateReviewsData(data), name).toEqual([]);
    expect(reviewsData.none.summary).toEqual({ average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } });
    expect(reviewsData.three.summary).toEqual({ average: 4, count: 3, distribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 1 } });
  });

  it('sorts reviews stably', () => {
    expect(sortReviews(reviewsForty, 'highest')[0]!.rating).toBe(5);
    expect(sortReviews(reviewsForty, 'lowest')[0]!.rating).toBe(2);
    const newest = sortReviews(reviewsForty, 'newest');
    expect(newest.every((r, i) => i === 0 || newest[i - 1]!.createdAt >= r.createdAt)).toBe(true);
    expect(summarizeReviews([{ id: 'a', author: 'A', rating: 4, body: 'x', createdAt: '2026-01-01' }]).average).toBe(4);
  });

  it('a broken distribution is reported', () => {
    expect(codes(validateReviewsData({ ...reviewsData.three, summary: { ...reviewsData.three.summary, count: 9 } }))).toEqual(['invalid-field@summary.distribution']);
  });
});

describe('collection pages', () => {
  const keys = Object.keys(listingCollections) as ListingCollectionKey[];

  it.each(keys)('%s validates and its facets and pagination match its products', (key) => {
    const page = collectionPage(key);
    expect(validateCollectionPage(page)).toEqual([]);
    const source = listingCollections[key].products;
    expect(page.listing.total).toBe(source.length);
    expect(page.listing.pagination.totalPages).toBe(Math.max(1, Math.ceil(source.length / 12)));
    expect(page.listing.facets).toEqual(computeFacets(source, page.listing.filters));
    const kindCounts = page.listing.facets.kinds.reduce((sum, k) => sum + k.count, 0);
    expect(kindCounts).toBe(source.length);
  });

  it.each(Object.entries(filterQueries))('filter query %s builds a valid page', (_, query) => {
    const page = collectionPage('base', query);
    expect(validateCollectionPage(page)).toEqual([]);
    expect(page.listing.total).toBe(applyFilters(catalog.products, parseFilters(query)).length);
  });

  it('covers the listed cases', () => {
    expect(collectionPage('empty').listing.total).toBe(0);
    expect(collectionPage('oneProduct').listing.total).toBe(1);
    expect(collectionPage('base', filterQueries.noMatches).listing.total).toBe(0);
    expect(collectionPage('base', filterQueries.sizeAndColour).listing.products.map((p) => p.id)).toEqual(['prod-tee', 'prod-socks']);
    const loadMore = collectionPage('all', 'page=2', { mode: 'load-more' });
    expect(loadMore.listing.products).toHaveLength(24);
    expect(validateCollectionPage(loadMore)).toEqual([]);
    expect(validateCollectionPage(collectionPage('base', '', { subCollections: subCollectionTiles }))).toEqual([]);
  });

  it('reports inconsistent pagination and unsafe links', () => {
    const page = collectionPage('all');
    page.listing.pagination.totalPages = 7;
    page.collection.breadcrumbs[0]!.href = 'javascript:alert(1)';
    expect(codes(validateCollectionPage(page))).toEqual(expect.arrayContaining(['invalid-pagination@listing.pagination.totalPages', 'unsafe-href@collection.breadcrumbs[0].href']));
  });
});

describe('product pages', () => {
  it('validate for every kind', () => {
    for (const product of catalog.products) expect(validateProductPage(productPage(product)), product.id).toEqual([]);
    expect(validateProductPage(productPage(tee, reviewsData.forty, { initialSelection: { Size: 'L', Colour: 'Moss' } }))).toEqual([]);
    expect(validateProductPage(productPage(club, reviewsData.none, { initialPurchaseOption: club.purchaseOptions[2] }))).toEqual([]);
  });

  it('reports a selection or purchase option the product does not have', () => {
    const page = productPage(tee, reviewsData.three, { initialSelection: { Size: 'XXL', Colour: 'Moss' }, initialPurchaseOption: coffee.purchaseOptions[1] });
    expect(codes(validateProductPage(page))).toEqual(['invalid-field@initialSelection', 'invalid-field@initialPurchaseOption']);
  });

  it('round-trips through JSON', () => {
    const pages = [productPage(socks), productPage(guide), productPage(plannerApp), collectionPage('all', filterQueries.priceRange)];
    expect(JSON.parse(JSON.stringify(pages))).toEqual(pages);
  });
});

describe('commerce templates registry merge', () => {
  const templates = createTemplates(Object.values(commerceTemplates));

  it('adds collection and product-detail without changing the core registry', () => {
    expect(getTemplate('collection', templates)).toBe(commerceTemplates.collection);
    expect(getTemplate('product-detail', templates)).toBe(commerceTemplates['product-detail']);
    expect(defaultTemplates.collection).toBeUndefined();
    expect(getTemplate('blog-post', templates)).toBe(defaultTemplates['blog-post']);
  });

  it('unknown names and pages missing their data still fall back to default', () => {
    expect(getTemplate('wishlist', templates)).toBe(templates.default);
    expect(resolveTemplate({ id: 'x', slug: 'x', template: 'product-detail', seo: { title: 'X' }, blocks: [] }, templates).definition).toBe(templates.default);
  });

  it('renders each template with exactly one h1 and no skipped heading levels', () => {
    for (const page of [collectionPage('all'), collectionPage('empty'), collectionPage('base', '', { subCollections: subCollectionTiles }), productPage(tee), productPage(club, reviewsData.none), productPage(guide, reviewsData.forty)]) {
      const html = renderToStaticMarkup(createElement(PageRenderer, { page, chrome, templates }));
      const levels = [...html.matchAll(/<h([1-6])[\s>]/g)].map((m) => Number(m[1]));
      expect(levels.filter((l) => l === 1), page.id).toHaveLength(1);
      expect(levels.flatMap((l, i) => (i > 0 && l > levels[i - 1]! + 1 ? [`${levels[i - 1]}→${l}`] : [])), page.id).toEqual([]);
    }
  });
});
