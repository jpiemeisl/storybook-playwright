import { useEffect, useRef, useState } from 'react';
import { Icon } from '../../../components/Icon';
import { Image } from '../../../components/Image';
import { Lightbox } from '../../../components/Lightbox';
import type { ImageRef } from '../../../content-types/shared';
import styles from './ProductGallery.module.css';

export interface ProductGalleryProps {
  images: ImageRef[];
  /** Controlled current image (follow the selected variant's imageIndex). */
  index: number;
  onIndexChange: (index: number) => void;
  /** Product title, used in button names. */
  title: string;
}

/**
 * Product images. Wide containers: a main image (opens the Lightbox) with thumbnail buttons
 * (aria-current on the shown one). Narrow containers: a CSS scroll-snap strip with dot buttons.
 * 0 images shows a placeholder; 1 image hides the thumbnails. No hover zoom.
 */
export function ProductGallery({ images, index, onIndexChange, title }: ProductGalleryProps) {
  const [lightbox, setLightbox] = useState<number | null>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const current = Math.min(Math.max(index, 0), Math.max(images.length - 1, 0));

  // Keep the strip in step with the controlled index (e.g. a new variant was chosen).
  useEffect(() => {
    const strip = stripRef.current;
    const item = strip?.children[current] as HTMLElement | undefined;
    if (strip && item && Math.abs(strip.scrollLeft - item.offsetLeft) > 2) strip.scrollTo({ left: item.offsetLeft });
  }, [current]);

  if (images.length === 0) {
    return (
      <div className={styles.placeholder}>
        <Icon name="tag" size="xl" />
        <span>No image available</span>
      </div>
    );
  }

  const image = images[current]!;
  const many = images.length > 1;
  const lightboxImages = images.map((img) => ({ src: img.src, alt: img.alt, width: img.width ?? 1200, height: img.height ?? 1200 }));

  return (
    <div className={styles.root}>
      <div className={styles.wide}>
        <button type="button" className={styles.main} onClick={() => setLightbox(current)} aria-label={`Open image ${current + 1} of ${images.length} of ${title} full screen`}>
          <Image {...image} aspectRatio="1 / 1" fit="contain" loading="eager" />
          <span className={styles.expand} aria-hidden="true">
            <Icon name="expand" size="sm" />
          </span>
        </button>
        {many && (
          <ul className={styles.thumbs} aria-label={`${title} images`}>
            {images.map((img, i) => (
              <li key={`${img.src}-${i}`}>
                <button type="button" className={styles.thumb} aria-current={i === current ? 'true' : undefined} aria-label={`Show image ${i + 1} of ${images.length}${img.alt ? `: ${img.alt}` : ''}`} onClick={() => onIndexChange(i)}>
                  <Image {...img} alt="" aspectRatio="1 / 1" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.narrow}>
        <ul
          ref={stripRef}
          className={styles.strip}
          aria-label={`${title} images`}
          // Scrollable, so it must be reachable by keyboard (arrow keys scroll it).
          tabIndex={0}
          onScroll={(event) => {
            const strip = event.currentTarget;
            const next = Math.round(strip.scrollLeft / Math.max(strip.clientWidth, 1));
            if (next !== current && next >= 0 && next < images.length) onIndexChange(next);
          }}
        >
          {images.map((img, i) => (
            <li key={`${img.src}-${i}`} className={styles.slide}>
              <Image {...img} aspectRatio="1 / 1" fit="contain" loading={i === 0 ? 'eager' : 'lazy'} />
            </li>
          ))}
        </ul>
        {many && (
          <div className={styles.dots}>
            {images.map((_, i) => (
              <button key={i} type="button" className={styles.dot} aria-current={i === current ? 'true' : undefined} aria-label={`Show image ${i + 1} of ${images.length}`} onClick={() => onIndexChange(i)} />
            ))}
          </div>
        )}
      </div>

      <Lightbox images={lightboxImages} index={lightbox} onIndexChange={setLightbox} onClose={() => setLightbox(null)} label={`${title} images`} />
    </div>
  );
}
