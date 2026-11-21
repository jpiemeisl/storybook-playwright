import type { ArticleCardContent } from '../../content-types/sections';
import { formatIsoDate } from '../../utils/formatDate';
import { Badge } from '../Badge';
import { Card, type CardOrientation, type CardVariant } from '../Card';
import { Image } from '../Image';
import styles from './ArticleCard.module.css';

export interface ArticleCardProps {
  article: ArticleCardContent;
  variant?: CardVariant;
  orientation?: CardOrientation;
  headingLevel?: 2 | 3 | 4;
}

/** Blog/news card built on Card: category badge, author, publish date and reading time. */
export function ArticleCard({ article, variant = 'outlined', orientation = 'vertical', headingLevel = 3 }: ArticleCardProps) {
  const { title, href, excerpt, category, publishedAt, readingTimeMinutes, author, image } = article;

  return (
    <Card
      title={title}
      href={href}
      description={excerpt}
      image={image}
      eyebrow={category ? <Badge tone="accent" size="sm">{category}</Badge> : undefined}
      variant={variant}
      orientation={orientation}
      headingLevel={headingLevel}
      footer={
        <div className={styles.meta}>
          {author?.avatar && <Image {...author.avatar} alt="" width={32} height={32} className={styles.avatar} />}
          <div className={styles.metaText}>
            {author && <span className={styles.author}>{author.name}</span>}
            <span>
              <time dateTime={publishedAt}>{formatIsoDate(publishedAt)}</time>
              {readingTimeMinutes !== undefined && <> · {readingTimeMinutes} min read</>}
            </span>
          </div>
        </div>
      }
    />
  );
}
