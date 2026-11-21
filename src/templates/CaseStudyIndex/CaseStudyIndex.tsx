import { Card, CardGrid } from '../../components/Card';
import { Container } from '../../components/Container';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { Stack } from '../../components/Stack';
import { CategoryFilter } from '../../components/TagList';
import { Text } from '../../components/Text';
import type { PageContent } from '../../content-types/blocks';
import type { CaseStudyIndexPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { ListingHeader } from '../ListingHeader';
import { listPageHref } from '../pagination';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

export const canRenderCaseStudyIndex = (page: PageContent) => {
  const { heading, listing } = page as Partial<CaseStudyIndexPage>;
  return isObj(heading) && isObj(listing) && Array.isArray(listing.items) && isObj(listing.pagination);
};

/** Case study listing: page header, optional filter links, a grid of case study cards, pagination, empty state. */
export function CaseStudyIndex({ page, chrome, ctx }: TemplateProps<CaseStudyIndexPage>) {
  const { listing } = page;
  const view = useGuarded(
    (g) => ({
      items: listing.items.flatMap((item, i) => {
        const href = g.href(item.href, `listing.items[${i}].href`);
        return href ? [{ ...item, href, image: g.image(item.image, `listing.items[${i}].image`) }] : [];
      }),
      filters: (listing.filters ?? []).flatMap((f, i) => {
        const href = g.href(f.href, `listing.filters[${i}].href`);
        return href ? [{ id: f.id, label: f.label, href, count: f.count }] : [];
      }),
      allHref: g.href(listing.allHref, 'listing.allHref') ?? g.href(listing.pagination.basePath, 'listing.pagination.basePath') ?? '/',
    }),
    [listing],
    ctx?.onError,
  );
  const { currentPage, totalPages, basePath } = listing.pagination;

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <Stack gap="xl">
            <ListingHeader heading={page.heading} />
            {view.filters.length > 0 && (
              <CategoryFilter items={view.filters} selectedIds={listing.activeFilterId ? [listing.activeFilterId] : []} label={listing.filterLabel ?? 'Filter by industry'} />
            )}
            {view.items.length > 0 ? (
              <CardGrid columns={3}>
                {view.items.map((item) => (
                  <Card
                    key={item.id}
                    title={item.title}
                    href={item.href}
                    description={item.summary}
                    image={item.image}
                    eyebrow={item.client}
                    headingLevel={2}
                    footer={
                      item.keyResult && (
                        <Text size="sm" weight="strong">
                          {item.keyResult}
                        </Text>
                      )
                    }
                  />
                ))}
              </CardGrid>
            ) : (
              <EmptyState title="No case studies here yet" message="We have not published a case study for this filter yet." action={{ label: 'See all case studies', href: view.allHref }} />
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} hrefBuilder={(n) => listPageHref(basePath, n)} aria-label="Case study pages" />
          </Stack>
        </Container>
      </PageSection>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
