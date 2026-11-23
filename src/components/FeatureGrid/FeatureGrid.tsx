import type { ReactNode } from 'react';
import type { FeatureItem } from '../../component-types/sections';
import { Grid } from '../Grid';
import { Heading } from '../Heading';
import { Icon } from '../Icon';
import { Link } from '../Link';
import { Text } from '../Text';
import styles from './FeatureGrid.module.css';

/** Props for FeatureGrid. */
export interface FeatureGridProps {
  /** Features to list. Titles must be unique (used as keys); an item with `href` links its title. */
  items: FeatureItem[];
  /** Columns on wide slots; steps down to 1 on narrow ones. */
  columns?: 2 | 3 | 4;
  /** `stacked`: icon above text. `inline-icon`: icon beside text. */
  layout?: 'stacked' | 'inline-icon';
  /** Optional heading above the grid. */
  heading?: string;
  /** Optional lead text under the heading. */
  intro?: ReactNode;
  /** Level of `heading`; item titles use the next level down. Default 2. */
  headingLevel?: 2 | 3;
}

/** Grid of short features. Content block: place inside Section + Container. */
export function FeatureGrid({ items, columns = 3, layout = 'stacked', heading, intro, headingLevel = 2 }: FeatureGridProps) {
  const itemLevel = heading ? headingLevel + 1 : headingLevel;
  return (
    <div className={styles.root}>
      {(heading || intro) && (
        <div className={styles.header}>
          {heading && (
            <Heading as={`h${headingLevel}` as const} size="2xl">
              {heading}
            </Heading>
          )}
          {intro && (
            <Text as="div" size="lg" tone="muted">
              {intro}
            </Text>
          )}
        </div>
      )}
      <Grid as="ul" columns={columns} gap="lg">
        {items.map((item) => (
          <li key={item.title} className={[styles.item, styles[layout]].join(' ')}>
            {item.icon && (
              <span className={styles.icon}>
                <Icon name={item.icon} size="lg" />
              </span>
            )}
            <div className={styles.content}>
              <Heading as={`h${itemLevel}` as 'h3'} size="lg">
                {item.href ? <Link href={item.href} variant="standalone">{item.title}</Link> : item.title}
              </Heading>
              {item.description && (
                <Text as="div" size="sm" tone="muted">
                  {item.description}
                </Text>
              )}
            </div>
          </li>
        ))}
      </Grid>
    </div>
  );
}
