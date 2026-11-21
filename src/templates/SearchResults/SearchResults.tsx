import { Container } from '../../components/Container';
import { Pagination } from '../../components/Pagination';
import { SearchInput } from '../../components/SearchInput';
import { Stack } from '../../components/Stack';
import { Text } from '../../components/Text';
import type { PageContent } from '../../content-types/blocks';
import type { SearchPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { ListingHeader } from '../ListingHeader';
import { searchPageHref } from '../pagination';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';
import { NoQuery, NoResults, ResultList } from './SearchParts';

export const canRenderSearch = (page: PageContent) => {
  const { search } = page as Partial<SearchPage>;
  return isObj(search) && Array.isArray(search.results) && isObj(search.pagination);
};

/** "Showing 1–10 of 48 results for “vat”". */
export function resultSummary(query: string, total: number, page: number, shown: number, perPage = 10): string {
  if (!query) return '';
  if (total === 0) return `No results for “${query}”`;
  if (total === 1) return `1 result for “${query}”`;
  const first = (page - 1) * perPage + 1;
  return shown < total ? `Showing ${first}–${first + shown - 1} of ${total} results for “${query}”` : `${total} results for “${query}”`;
}

/**
 * Search results, presentational only: a real GET search form (field "q", works without JavaScript),
 * the result count in a polite live region, the results and pagination. States: no query, no
 * results (suggestions and a contact link), and results.
 */
export function SearchResults({ page, chrome, ctx }: TemplateProps<SearchPage>) {
  const { search } = page;
  const query = search.query.trim();
  const { basePath, currentPage, totalPages } = search.pagination;
  const view = useGuarded(
    (g) => ({
      action: g.href(search.action, 'search.action') ?? g.href(basePath, 'search.pagination.basePath') ?? '/search',
      results: search.results.flatMap((result, i) => {
        const url = g.href(result.url, `search.results[${i}].url`);
        return url ? [{ ...result, url }] : [];
      }),
      contact: g.link(search.contactLink, 'search.contactLink'),
    }),
    [search, basePath],
    ctx?.onError,
  );

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="lg">
          <Stack gap="lg">
            <ListingHeader heading={{ title: 'Search' }} />
            <SearchInput action={view.action} name="q" defaultValue={search.query} label="Search the site" showSubmitButton size="lg" onSearch={ctx?.onSearch} />
            <Text role="status" weight="strong">
              {resultSummary(query, search.total, currentPage, view.results.length)}
            </Text>
            {!query ? (
              <NoQuery />
            ) : view.results.length === 0 ? (
              <NoResults query={query} suggestions={search.suggestions ?? []} basePath={view.action} contact={view.contact} />
            ) : (
              <ResultList results={view.results} />
            )}
            {query && <Pagination currentPage={currentPage} totalPages={totalPages} hrefBuilder={(n) => searchPageHref(view.action, query, n)} aria-label="Search result pages" />}
          </Stack>
        </Container>
      </PageSection>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
