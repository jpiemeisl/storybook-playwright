import { ArticleCard } from '../../components/ArticleCard';
import { CardGrid } from '../../components/Card';
import { Container } from '../../components/Container';
import { EmptyState } from '../../components/EmptyState';
import { Pagination } from '../../components/Pagination';
import { Stack } from '../../components/Stack';
import { CategoryFilter } from '../../components/TagList';
import type { PageContent } from '../../content-types/blocks';
import type { BlogIndexPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { ListingHeader } from '../ListingHeader';
import { listPageHref } from '../pagination';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

export const canRenderBlogIndex = (page: PageContent) => {
  const { heading, listing } = page as Partial<BlogIndexPage>;
  return isObj(heading) && isObj(listing) && Array.isArray(listing.items) && isObj(listing.pagination);
};

/**
 * Blog listing: page header, category links, an optional featured post, a grid of posts and
 * pagination; an empty state when the category has no posts. Blocks render below the listing.
 */
export function BlogIndex({ page, chrome, ctx }: TemplateProps<BlogIndexPage>) {
  const { listing } = page;
  const view = useGuarded(
    (g) => ({
      featured: listing.featured && g.article(listing.featured, 'listing.featured'),
      items: listing.items.flatMap((item, i) => g.article(item, `listing.items[${i}]`) ?? []),
      categories: (listing.categories ?? []).flatMap((c, i) => {
        const href = g.href(c.href, `listing.categories[${i}].href`);
        return href ? [{ id: c.id, label: c.label, href, count: c.count }] : [];
      }),
      allHref: g.href(listing.allPostsHref, 'listing.allPostsHref') ?? g.href(listing.pagination.basePath, 'listing.pagination.basePath') ?? '/',
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
            {view.categories.length > 0 && (
              <CategoryFilter items={view.categories} selectedIds={listing.activeCategoryId ? [listing.activeCategoryId] : []} label="Blog categories" />
            )}
            {view.featured && <ArticleCard article={view.featured} variant="elevated" orientation="horizontal" size="lg" headingLevel={2} />}
            {view.items.length > 0 ? (
              <CardGrid columns={3}>
                {view.items.map((article) => (
                  <ArticleCard key={article.href} article={article} headingLevel={2} />
                ))}
              </CardGrid>
            ) : (
              !view.featured && (
                <EmptyState
                  title="No posts in this category yet"
                  message="New articles are added every month. In the meantime, browse everything we have written."
                  action={{ label: 'See all posts', href: view.allHref }}
                />
              )
            )}
            <Pagination currentPage={currentPage} totalPages={totalPages} hrefBuilder={(n) => listPageHref(basePath, n)} aria-label="Blog pages" />
          </Stack>
        </Container>
      </PageSection>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
