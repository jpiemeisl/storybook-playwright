import { AuthorByline } from '../../components/AuthorByline';
import { Heading } from '../../components/Heading';
import { Stack } from '../../components/Stack';
import { TagList } from '../../components/TagList';
import type { AuthorContent } from '../../component-types/content';
import type { BlogPostPage } from '../../content-types/templates';
import { ListingHeader } from '../ListingHeader';

/** Breadcrumbs, title (h1), excerpt, byline with date and reading time, and tags. */
export function ArticleHeader({ article, author, tags }: { article: BlogPostPage['article']; author: AuthorContent; tags: { label: string; href?: string }[] }) {
  return (
    <ListingHeader
      heading={{ title: article.title, description: article.excerpt, breadcrumbs: article.breadcrumbs }}
      meta={
        <Stack gap="md">
          <AuthorByline author={author} date={article.publishedAt} readingTime={article.readingTime ? `${article.readingTime} min read` : undefined} />
          <TagList items={tags} size="sm" label="Tags" />
        </Stack>
      }
    />
  );
}

/** "About the author" with the block byline (role and bio). */
export function AuthorBio({ author }: { author: AuthorContent }) {
  return (
    <Stack as="section" gap="md" aria-labelledby="about-the-author">
      <Heading as="h2" size="lg" id="about-the-author">
        About the author
      </Heading>
      <AuthorByline author={author} variant="block" />
    </Stack>
  );
}
