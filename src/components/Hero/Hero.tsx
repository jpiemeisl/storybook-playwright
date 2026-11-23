import type { HeroContent } from '../../component-types/sections';
import { ActionGroup } from '../ActionGroup';
import { Container } from '../Container';
import { Heading } from '../Heading';
import { Image } from '../Image';
import { Text } from '../Text';
import styles from './Hero.module.css';

/** Hero layout: `centered` text with media below, `split` text beside media, `background` text over a full-bleed image. */
export type HeroVariant = 'centered' | 'split' | 'background';

/** Props for Hero: the HeroContent fields plus layout options. */
export interface HeroProps extends HeroContent {
  /** Layout. `background` is full-bleed and brings its own Container. */
  variant?: HeroVariant;
  /** Split variant: which side the media sits on from 48rem. */
  mediaPosition?: 'start' | 'end';
  /** Split variant: media above or below the text when stacked on narrow slots. */
  mobileMediaOrder?: 'first' | 'last';
  /** Heading level of the headline. Default 1. */
  headingLevel?: 1 | 2 | 3;
}

/**
 * Page-opening block. `centered` and `split` are content: place them in a Section + Container (any
 * background). `background` is full-bleed: place it directly in the page or in <Section padding="none">;
 * it brings its own Container and an inverse surface over a dark scrim so text stays legible.
 */
export function Hero({
  headline,
  subhead,
  primaryAction,
  secondaryAction,
  media,
  variant = 'centered',
  mediaPosition = 'end',
  mobileMediaOrder = 'last',
  headingLevel = 1,
}: HeroProps) {
  const text = (
    <div className={styles.text}>
      <Heading as={`h${headingLevel}` as const} size="4xl">
        {headline}
      </Heading>
      {subhead && (
        <Text as="div" size="lg" tone="muted" className={styles.subhead}>
          {subhead}
        </Text>
      )}
      <ActionGroup
        actions={[primaryAction, secondaryAction]}
        justify={variant === 'centered' ? 'center' : 'start'}
        className={styles.actions}
      />
    </div>
  );

  if (variant === 'background') {
    return (
      <div className={styles.background} data-surface="inverse">
        {media && <Image {...media} loading="eager" fit="cover" className={styles.backgroundImage} />}
        <Container size="xl" className={styles.backgroundInner}>
          {text}
        </Container>
      </div>
    );
  }

  return (
    <div
      className={[styles.hero, styles[variant]].join(' ')}
      data-media-position={mediaPosition}
      data-mobile-media-order={mobileMediaOrder}
    >
      <div className={styles.layout}>
        {text}
        {media && (
          <div className={styles.media}>
            <Image {...media} aspectRatio={variant === 'centered' ? '16 / 9' : '4 / 3'} loading="eager" />
          </div>
        )}
      </div>
    </div>
  );
}
