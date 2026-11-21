import { Heading } from '../../../components/Heading';
import { Icon } from '../../../components/Icon';
import { Image } from '../../../components/Image';
import { Link } from '../../../components/Link';
import type { ImageRef } from '../../../content-types/shared';
import styles from './CollectionCard.module.css';

export interface CollectionCardProps {
  title: string;
  href: string;
  /** Number of products, shown as "12 products". */
  productCount?: number;
  image?: ImageRef;
  headingLevel?: 2 | 3 | 4;
}

/** A category tile: image, title and product count; the title link covers the tile. */
export function CollectionCard({ title, href, productCount, image, headingLevel = 3 }: CollectionCardProps) {
  return (
    <article className={styles.card}>
      <div className={styles.media}>
        {image ? <Image {...image} alt="" aspectRatio="4 / 3" /> : <Icon name="tag" size="xl" className={styles.placeholder} />}
      </div>
      <div className={styles.body}>
        <Heading as={`h${headingLevel}` as const} size="md" className={styles.title}>
          <Link href={href} unstyled className={styles.link}>
            {title}
          </Link>
        </Heading>
        {productCount !== undefined && (
          <p className={styles.count}>
            {productCount} {productCount === 1 ? 'product' : 'products'}
          </p>
        )}
      </div>
    </article>
  );
}
