/** URL of page `page` of a list whose first page is `basePath`: page 1 → basePath, then `${basePath}/page/n`. */
export function listPageHref(basePath: string, page: number): string {
  const base = basePath.replace(/\/+$/, '') || '/';
  if (page <= 1) return base;
  return `${base === '/' ? '' : base}/page/${page}`;
}

/** URL of a search results page: `${basePath}?q=…` plus `&page=n` after page 1. */
export function searchPageHref(basePath: string, query: string, page: number): string {
  const params = new URLSearchParams({ q: query });
  if (page > 1) params.set('page', String(page));
  return `${basePath}?${params.toString()}`;
}
