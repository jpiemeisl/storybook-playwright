import type { ArticleCardContent } from '../../component-types/sections';
import { ArticleCard } from '../ArticleCard';
import { CardGrid } from '../Card';
import { Heading } from '../Heading';
import styles from './RelatedPosts.module.css';

/** Props for RelatedPosts. */
export interface RelatedPostsProps {
  /** Articles to show. Only the first four are used; hrefs must be unique (used as keys). */
  items: ArticleCardContent[];
  /** Section heading and accessible name. Default "Related articles". */
  heading?: string;
  /** Heading level of `heading`; card titles use the next level down. Default 2. */
  headingLevel?: 2 | 3;
}

/** Up to four related articles. Renders nothing when there are none. */
export function RelatedPosts({ items, heading = 'Related articles', headingLevel = 2 }: RelatedPostsProps) {
  const shown = items.slice(0, 4);
  if (shown.length === 0) return null;
  return (
    <section className={styles.related} aria-label={heading}>
      <Heading as={`h${headingLevel}` as const} size="xl">
        {heading}
      </Heading>
      <CardGrid columns={shown.length === 4 ? 4 : 3}>
        {shown.map((article) => (
          <ArticleCard key={article.href} article={article} headingLevel={(headingLevel + 1) as 3 | 4} />
        ))}
      </CardGrid>
    </section>
  );
}
