import { Container } from '../../components/Container';
import { Image } from '../../components/Image';
import { RelatedPosts } from '../../components/RelatedPosts';
import { ShareLinks } from '../../components/ShareLinks';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Stack } from '../../components/Stack';
import { TableOfContents } from '../../components/TableOfContents';
import type { PageContent } from '../../content-types/blocks';
import type { BlogPostPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { prepareBody, reservedIds } from '../prose';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';
import { ArticleHeader, AuthorBio } from './ArticleParts';

export const canRenderBlogPost = (page: PageContent) => {
  const { article } = page as Partial<BlogPostPage>;
  return isObj(article) && typeof article.title === 'string' && isObj(article.author) && Array.isArray(article.body);
};

/**
 * Blog post: breadcrumbs and article header (h1), hero image, the body beside a sticky table of
 * contents (collapsible above the body on narrow screens), share links, author bio, related posts,
 * then the page's blocks (e.g. a call to action).
 */
export function BlogPost({ page, chrome, ctx }: TemplateProps<BlogPostPage>) {
  const { article } = page;
  const view = useGuarded(
    (g) => {
      const body = prepareBody(article.body, reservedIds(article.body, page.blocks));
      return {
        ...body,
        hero: g.image(article.heroImage, 'article.heroImage'),
        avatar: g.image(article.author.avatar, 'article.author.avatar'),
        authorHref: g.href(article.author.href, 'article.author.href'),
        shareUrl: g.href(article.shareUrl ?? page.seo.canonicalUrl, 'article.shareUrl'),
        tags: (article.tags ?? []).map((tag, i) => ({ label: tag.label, href: g.href(tag.href, `article.tags[${i}].href`) })),
        related: (article.related ?? []).flatMap((item, i) => g.article(item, `article.related[${i}]`) ?? []),
      };
    },
    [page],
    ctx?.onError,
  );
  const author = { name: article.author.name, role: article.author.role, avatar: view.avatar, href: view.authorHref };

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <Stack as="article" gap="xl">
            <ArticleHeader article={article} author={author} tags={view.tags} />
            {view.hero && <Image {...view.hero} aspectRatio="16 / 9" loading="eager" />}
            <SidebarLayout aside={view.toc.length > 0 ? <TableOfContents items={view.toc} /> : undefined}>
              <Stack gap="xl">
                <TemplateBlocks blocks={view.blocks} ctx={ctx} h1Provided layout="flow" />
                {view.shareUrl && <ShareLinks url={view.shareUrl} title={article.title} label="Share this article" />}
                {article.author.bio && <AuthorBio author={{ ...author, bio: article.author.bio }} />}
              </Stack>
            </SidebarLayout>
          </Stack>
        </Container>
      </PageSection>
      {view.related.length > 0 && (
        <PageSection background="subtle">
          <Container size="xl">
            <RelatedPosts items={view.related} headingLevel={2} />
          </Container>
        </PageSection>
      )}
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
