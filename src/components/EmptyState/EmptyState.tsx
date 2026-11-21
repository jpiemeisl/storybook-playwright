import type { ReactNode } from 'react';
import type { ActionLink } from '../../component-types/sections';
import { ButtonLink } from '../Button';
import { Heading } from '../Heading';
import { Text } from '../Text';
import styles from './EmptyState.module.css';

export interface EmptyStateProps {
  title: string;
  /** Short explanation of why there is nothing here. */
  message?: ReactNode;
  /** One way forward, e.g. back to all posts. */
  action?: ActionLink;
  /** Extra content under the message, e.g. a list of suggestions. */
  children?: ReactNode;
  headingLevel?: 2 | 3;
}

/** Placeholder for a list or search with no results: a dashed panel with a title, message and an action. */
export function EmptyState({ title, message, action, children, headingLevel = 2 }: EmptyStateProps) {
  return (
    <div className={styles.empty}>
      <Heading as={`h${headingLevel}` as const} size="lg">
        {title}
      </Heading>
      {message && (
        <Text as="div" tone="muted">
          {message}
        </Text>
      )}
      {children}
      {action && (
        <ButtonLink href={action.href} variant="secondary" className={styles.action}>
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
