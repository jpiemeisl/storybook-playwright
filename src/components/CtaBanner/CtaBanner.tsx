import type { CtaContent } from '../../component-types/sections';
import { ActionGroup } from '../ActionGroup';
import { Heading } from '../Heading';
import { Text } from '../Text';
import styles from './CtaBanner.module.css';

export type CtaBannerVariant = 'accent' | 'inverse' | 'subtle';

export interface CtaBannerProps extends CtaContent {
  variant?: CtaBannerVariant;
  /** `split` puts the actions beside the text from 56rem. */
  layout?: 'centered' | 'split';
  headingLevel?: 2 | 3;
}

/** Call-to-action panel with its own surface. Content block: place inside Section + Container. */
export function CtaBanner({
  heading,
  body,
  primaryAction,
  secondaryAction,
  variant = 'accent',
  layout = 'centered',
  headingLevel = 2,
}: CtaBannerProps) {
  return (
    <div className={styles.root}>
      <div
        className={[styles.banner, styles[variant], styles[layout]].join(' ')}
        // inverse: dark panel. accent: always a light panel, even inside an inverse Section.
        data-surface={variant === 'inverse' ? 'inverse' : variant === 'accent' ? 'default' : undefined}
      >
        <div className={styles.text}>
          <Heading as={`h${headingLevel}` as const} size="2xl">
            {heading}
          </Heading>
          {body && (
            <Text as="div" tone="muted">
              {body}
            </Text>
          )}
        </div>
        <ActionGroup
          actions={[primaryAction, secondaryAction]}
          justify={layout === 'centered' ? 'center' : 'start'}
          className={styles.actions}
        />
      </div>
    </div>
  );
}
