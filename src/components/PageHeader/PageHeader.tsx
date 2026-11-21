import type { ReactNode } from 'react';
import type { PageHeaderContent } from '../../component-types/content';
import { Heading } from '../Heading';
import { Text } from '../Text';
import styles from './PageHeader.module.css';

export interface PageHeaderProps extends PageHeaderContent {
  /** e.g. <Breadcrumbs />, shown above the title. */
  breadcrumbs?: ReactNode;
  /** e.g. an AuthorByline or tags, shown under the description. */
  meta?: ReactNode;
  /** Buttons or links. */
  actions?: ReactNode;
  /** Image or illustration; used by the `with-media` variant. */
  media?: ReactNode;
  variant?: 'default' | 'centered' | 'with-media';
  headingLevel?: 1 | 2;
}

/** Top of a content page. A content block: place it inside Section + Container (any background). */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  meta,
  actions,
  media,
  variant = 'default',
  headingLevel = 1,
}: PageHeaderProps) {
  const withMedia = variant === 'with-media' && media;
  return (
    <header className={[styles.root, styles[variant], withMedia && styles.hasMedia].filter(Boolean).join(' ')}>
      <div className={styles.layout}>
        <div className={styles.text}>
          {breadcrumbs}
          <Heading as={`h${headingLevel}` as const} size="4xl" className={styles.title}>
            {title}
          </Heading>
          {description && (
            <Text as="div" size="lg" tone="muted" className={styles.description}>
              {description}
            </Text>
          )}
          {meta && <div className={styles.meta}>{meta}</div>}
          {actions && <div className={styles.actions}>{actions}</div>}
        </div>
        {withMedia && <div className={styles.media}>{media}</div>}
      </div>
    </header>
  );
}
