/*
 * Validators for the commerce template pages. They reuse the core page checks (id, slug, seo) and the
 * commerce product and reviews validators, and add pagination sanity, selection and link checks.
 */
import { Checker, isObj, type ValidationIssue } from '../../registry/checker';
import { isSafeHref } from '../../registry/links';
import type { Product } from '../types/product';
import { validateProduct, validateReviewsData } from './validate';
import { purchaseOptionKey } from './options';
import { resolveVariant } from './variants';

const prefix = (issues: ValidationIssue[], path: string) => issues.map((issue) => ({ ...issue, path: issue.path ? `${path}.${issue.path}` : path }));

function base(page: unknown, check: (c: Checker) => void): ValidationIssue[] {
  if (!isObj(page)) return [{ code: 'invalid-field', severity: 'error', message: 'A page must be an object.', path: '' }];
  const issues: ValidationIssue[] = [];
  const c = new Checker(page, '', issues, {});
  c.str('id');
  if (typeof page.slug !== 'string') c.report('missing-field', 'slug', '"slug" is required.');
  c.child('seo', true, (seo) => seo.str('title'));
  check(c);
  return issues;
}

const breadcrumbs = (c: Checker, key = 'breadcrumbs', required = false) =>
  c.each(key, required ? 1 : 0, 8, (b) => {
    b.str('label');
    b.href('href', false);
  });

/** Collection page: header, breadcrumbs, products, total and pagination that agree, safe links. */
export function validateCollectionPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'collection') c.report('invalid-field', 'template', 'template must be "collection".');
    c.child('collection', true, (col) => {
      col.str('title');
      breadcrumbs(col);
      col.image('image');
    });
    c.child('listing', true, (l) => {
      const products = Array.isArray(l.value.products) ? l.value.products : [];
      products.forEach((product, i) => l.issues.push(...prefix(validateProduct(product), `listing.products[${i}]`)));
      const total = l.value.total;
      const perPage = l.value.perPage;
      if (typeof total !== 'number' || !Number.isInteger(total) || total < 0) l.report('invalid-field', 'total', '"total" must be a whole number of at least 0.');
      if (typeof perPage !== 'number' || !Number.isInteger(perPage) || perPage < 1) l.report('invalid-field', 'perPage', '"perPage" must be a whole number of at least 1.');
      l.oneOf('mode', ['pages', 'load-more']);
      l.child('pagination', true, (p) => {
        p.href('basePath');
        const { currentPage, totalPages } = p.value;
        if (typeof totalPages !== 'number' || !Number.isInteger(totalPages) || totalPages < 1) p.report('invalid-pagination', 'totalPages', '"totalPages" must be a whole number of at least 1.');
        else if (typeof currentPage !== 'number' || !Number.isInteger(currentPage) || currentPage < 1 || currentPage > totalPages) p.report('invalid-pagination', 'currentPage', `"currentPage" must be from 1 to ${totalPages}.`);
        else if (typeof total === 'number' && typeof perPage === 'number' && perPage > 0 && totalPages !== Math.max(1, Math.ceil(total / perPage))) {
          p.report('invalid-pagination', 'totalPages', `"totalPages" should be ${Math.max(1, Math.ceil(total / perPage))} for ${total} products at ${perPage} per page.`);
        }
      });
      if (typeof total === 'number' && products.length > total) l.report('invalid-field', 'products', 'More products than "total".');
      if (l.value.mode === 'pages' && typeof perPage === 'number' && products.length > perPage) l.report('invalid-field', 'products', 'A page in "pages" mode has more products than "perPage".');
    });
    c.each('subCollections', 0, 8, (s) => {
      s.str('title');
      s.href('href');
      s.image('image');
    });
  });
}

/** Product page: product, reviews and related products validate; the initial selection and purchase option exist. */
export function validateProductPage(page: unknown): ValidationIssue[] {
  return base(page, (c) => {
    if (c.value.template !== 'product-detail') c.report('invalid-field', 'template', 'template must be "product-detail".');
    const product = c.value.product;
    if (!isObj(product)) c.report('missing-field', 'product', '"product" is required.');
    else c.issues.push(...prefix(validateProduct(product), 'product'));
    if (!isObj(c.value.reviews)) c.report('missing-field', 'reviews', '"reviews" is required.');
    else c.issues.push(...prefix(validateReviewsData(c.value.reviews), 'reviews'));
    if (!Array.isArray(c.value.related)) c.report('missing-field', 'related', '"related" is required (it may be empty).');
    else c.value.related.forEach((p, i) => c.issues.push(...prefix(validateProduct(p), `related[${i}]`)));
    breadcrumbs(c);
    const selection = c.value.initialSelection;
    if (selection !== undefined && isObj(product) && Array.isArray(product.variants)) {
      if (!isObj(selection) || !resolveVariant(product as unknown as Product, selection as Record<string, string>)) c.report('invalid-field', 'initialSelection', '"initialSelection" does not match a variant of the product.');
    }
    const option = c.value.initialPurchaseOption;
    if (option !== undefined && isObj(product) && Array.isArray(product.purchaseOptions)) {
      const keys = (product.purchaseOptions as Product['purchaseOptions']).map(purchaseOptionKey);
      if (!isObj(option) || !keys.includes(purchaseOptionKey(option as never))) c.report('invalid-field', 'initialPurchaseOption', '"initialPurchaseOption" is not one of the product’s purchase options.');
    }
    if (isObj(product) && Array.isArray(product.images)) {
      product.images.forEach((img, i) => {
        if (isObj(img) && typeof img.src === 'string' && !isSafeHref(img.src)) c.report('unsafe-src', `product.images[${i}].src`, 'Unsafe image source.');
      });
    }
  });
}
