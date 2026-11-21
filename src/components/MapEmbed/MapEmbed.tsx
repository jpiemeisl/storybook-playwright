import { useState } from 'react';
import type { MapContent } from '../../content-types/content';
import type { ImageContent } from '../../content-types/sections';
import { Button } from '../Button';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Link } from '../Link';
import styles from './MapEmbed.module.css';

export interface MapEmbedProps extends MapContent {
  /** Local static image shown before activation. Defaults to a CSS map pattern. */
  placeholder?: ImageContent;
  /** CSS aspect-ratio of the map area. Default "16 / 9". */
  aspectRatio?: string;
}

/**
 * Click-to-load map. Before the user asks for it there is no iframe and no request to the map
 * provider: just the address, "Show map" and a plain "Get directions" link (works without JS).
 */
export function MapEmbed({ src, title, address, directionsHref, placeholder, aspectRatio = '16 / 9' }: MapEmbedProps) {
  const [active, setActive] = useState(false);

  return (
    <div className={styles.root}>
      <div className={styles.frame} style={{ aspectRatio }}>
        {active ? (
          <iframe src={src} title={title} loading="lazy" referrerPolicy="no-referrer" className={styles.iframe} />
        ) : (
          <>
            {placeholder ? (
              <Image {...placeholder} alt="" fit="cover" className={styles.placeholderImage} />
            ) : (
              <div className={styles.pattern} aria-hidden="true" />
            )}
            <div className={styles.panel}>
              <Icon name="map-pin" size="lg" className={styles.pin} />
              <Button variant="secondary" onClick={() => setActive(true)}>
                Show map
              </Button>
              <p className={styles.note}>Loads a map from an external provider.</p>
            </div>
          </>
        )}
      </div>
      <div className={styles.details}>
        <address className={styles.address}>
          <Icon name="map-pin" size="sm" />
          <span>{address}</span>
        </address>
        <Link href={directionsHref} variant="standalone" target="_blank">
          Get directions
        </Link>
      </div>
    </div>
  );
}
