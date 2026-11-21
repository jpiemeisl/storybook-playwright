import type { ReactNode } from 'react';
import type { MediaTextContent } from '../../content-types/sections';
import { ActionGroup } from '../ActionGroup';
import { Heading } from '../Heading';
import { Text } from '../Text';
import styles from './MediaText.module.css';

export interface MediaTextProps extends MediaTextContent {
  /** An <Image>, video, illustration or any other node. */
  media: ReactNode;
  /** Side the media sits on from 48rem. Stacked (media first) below that. */
  mediaPosition?: 'start' | 'end';
  /** `balanced` = 1:1, `wide` = media takes ~60%. */
  mediaWidth?: 'balanced' | 'wide';
  headingLevel?: 2 | 3 | 4;
}

/** Media beside text. Content block: place inside Section + Container. */
export function MediaText({
  media,
  eyebrow,
  heading,
  body,
  actions = [],
  mediaPosition = 'start',
  mediaWidth = 'balanced',
  headingLevel = 2,
}: MediaTextProps) {
  return (
    <div className={styles.root}>
      <div className={[styles.layout, styles[mediaWidth]].join(' ')} data-media-position={mediaPosition}>
        <div className={styles.media}>{media}</div>
        <div className={styles.text}>
          {eyebrow && (
            <Text as="p" size="sm" weight="strong" className={styles.eyebrow}>
              {eyebrow}
            </Text>
          )}
          <Heading as={`h${headingLevel}` as const} size="2xl">
            {heading}
          </Heading>
          {body && (
            <Text as="div" tone="muted" className={styles.body}>
              {body}
            </Text>
          )}
          <ActionGroup actions={actions} className={styles.actions} />
        </div>
      </div>
    </div>
  );
}
