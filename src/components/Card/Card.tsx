import { Children, type ReactNode } from 'react';
import type { CardContent } from '../../component-types/sections';
import { Grid } from '../Grid';
import { Heading } from '../Heading';
import { Image } from '../Image';
import { Link } from '../Link';
import { Text } from '../Text';
import styles from './Card.module.css';

export type CardVariant = 'elevated' | 'outlined' | 'flat';
export type CardOrientation = 'vertical' | 'horizontal';
export type CardSize = 'md' | 'lg';

export interface CardProps extends CardContent {
  /** CSS aspect-ratio for the image. Default "16 / 9". */
  imageAspectRatio?: string;
  /** Meta, actions or anything else at the bottom. Links here stay clickable above the card link. */
  footer?: ReactNode;
  variant?: CardVariant;
  /** `horizontal` puts the image beside the body when the card is at least 32rem wide. */
  orientation?: CardOrientation;
  headingLevel?: 2 | 3 | 4;
  /** `lg`: larger title and more padding, for a featured item above a grid. Default "md". */
  size?: CardSize;
}

/**
 * Content card. With `href`, the title is the card's only link and its hit area is stretched over the
 * whole card, so the card is clickable without nesting links or wrapping the card in an anchor.
 */
export function Card({
  title,
  href,
  description,
  eyebrow,
  image,
  imageAspectRatio = '16 / 9',
  footer,
  variant = 'outlined',
  orientation = 'vertical',
  headingLevel = 3,
  size = 'md',
}: CardProps) {
  return (
    <article className={styles.root}>
      <div className={[styles.card, styles[variant], styles[orientation], size === 'lg' && styles.large, href && styles.linked].filter(Boolean).join(' ')}>
        {image && (
          <div className={styles.media}>
            <Image {...image} aspectRatio={imageAspectRatio} />
          </div>
        )}
        <div className={styles.body}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <Heading as={`h${headingLevel}` as const} size={size === 'lg' ? '2xl' : 'lg'} className={styles.title}>
            {href ? (
              <Link href={href} unstyled className={styles.titleLink}>
                {title}
              </Link>
            ) : (
              title
            )}
          </Heading>
          {description && (
            <Text as="div" size={size === 'lg' ? 'md' : 'sm'} tone="muted" className={styles.description}>
              {description}
            </Text>
          )}
          {footer && <div className={styles.footer}>{footer}</div>}
        </div>
      </div>
    </article>
  );
}

export interface CardGridProps {
  /** Card elements. Each is wrapped in a list item. */
  children: ReactNode;
  /** Column count for wide slots (steps down on narrow ones). Ignored with `minItemWidth`. */
  columns?: number;
  /** Auto-fit cards at least this wide instead of fixed columns, e.g. "18rem". */
  minItemWidth?: string;
}

/** A list of cards in a Grid. Every row stretches its cards to the same height. */
export function CardGrid({ children, columns = 3, minItemWidth }: CardGridProps) {
  return (
    <Grid as="ul" columns={columns} minItemWidth={minItemWidth} gap="lg" className={styles.grid}>
      {Children.map(children, (child) => (
        <li className={styles.gridItem}>{child}</li>
      ))}
    </Grid>
  );
}
