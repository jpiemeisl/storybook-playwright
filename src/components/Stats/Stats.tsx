import type { StatItem } from '../../component-types/sections';
import { Grid } from '../Grid';
import { Heading } from '../Heading';
import styles from './Stats.module.css';

export interface StatsProps {
  items: StatItem[];
  heading?: string;
  /** Columns on wide slots (2-4). Defaults to the item count, capped at 4. */
  columns?: 2 | 3 | 4;
  headingLevel?: 2 | 3;
}

/**
 * Key figures as a description list (label + value). Values are shown large, but read label-first.
 * Colours come from semantic tokens, so it works on any Section background including inverse.
 */
export function Stats({ items, heading, columns, headingLevel = 2 }: StatsProps) {
  const cols = columns ?? Math.min(Math.max(items.length, 2), 4);
  return (
    <div className={styles.root}>
      {heading && (
        <Heading as={`h${headingLevel}` as const} size="xl">
          {heading}
        </Heading>
      )}
      <Grid as="dl" columns={{ base: Math.min(cols, 2), md: cols }} gap="lg" className={styles.list}>
        {items.map((item) => (
          <div key={item.label} className={styles.item}>
            <dt className={styles.label}>{item.label}</dt>
            <dd className={styles.value}>{item.value}</dd>
            {item.description && <dd className={styles.description}>{item.description}</dd>}
          </div>
        ))}
      </Grid>
    </div>
  );
}
