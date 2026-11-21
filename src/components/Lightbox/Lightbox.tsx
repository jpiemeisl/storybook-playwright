import { useEffect } from 'react';
import type { GalleryImage } from '../../content-types/content';
import { Icon } from '../Icon';
import { Image } from '../Image';
import { Modal } from '../Modal';
import styles from './Lightbox.module.css';

export interface LightboxProps {
  images: GalleryImage[];
  /** Index of the image shown; null closes the lightbox. */
  index: number | null;
  onIndexChange: (index: number) => void;
  onClose: () => void;
  /** Accessible name of the dialog. */
  label?: string;
}

/**
 * Full-screen image viewer on Modal: caption, "3 of 12" counter, previous/next buttons and
 * ArrowLeft/ArrowRight keys (stopping at the ends), Escape to close. Neighbouring images are
 * preloaded in an effect. No autoplay.
 */
export function Lightbox({ images, index, onIndexChange, onClose, label = 'Image viewer' }: LightboxProps) {
  const open = index !== null && images.length > 0;
  const current = open ? Math.min(Math.max(index, 0), images.length - 1) : 0;
  const image = images[current];
  const multiple = images.length > 1;
  const hasPrevious = current > 0;
  const hasNext = current < images.length - 1;

  // Preload neighbours so next/previous feel instant. Effects only: nothing at render time.
  useEffect(() => {
    if (!open) return;
    for (const neighbour of [images[current - 1], images[current + 1]]) {
      if (neighbour) new window.Image().src = neighbour.src;
    }
  }, [open, current, images]);

  const go = (next: number) => {
    if (next >= 0 && next < images.length) onIndexChange(next);
  };

  // Arrow keys work wherever focus is inside the dialog (it starts on the close button).
  useEffect(() => {
    if (!open || !multiple) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault();
      const next = current + (event.key === 'ArrowRight' ? 1 : -1);
      if (next >= 0 && next < images.length) onIndexChange(next);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, multiple, current, images.length, onIndexChange]);

  return (
    <Modal open={open} onClose={onClose} title={label} hideTitle size="full" className={styles.lightbox}>
      {image && (
        <div className={styles.viewer}>
          <figure className={styles.figure}>
            <Image {...image} loading="eager" fit="contain" className={styles.image} />
            {(image.caption || multiple) && (
              <figcaption className={styles.caption}>
                {multiple && (
                  <span className={styles.counter} aria-live="polite">
                    {current + 1} of {images.length}
                  </span>
                )}
                {image.caption && <span>{image.caption}</span>}
              </figcaption>
            )}
          </figure>
          {multiple && (
            <div className={styles.controls}>
              <button
                type="button"
                className={styles.nav}
                onClick={() => go(current - 1)}
                aria-disabled={!hasPrevious || undefined}
                aria-label="Previous image"
              >
                <Icon name="arrow-left" />
              </button>
              <button
                type="button"
                className={styles.nav}
                onClick={() => go(current + 1)}
                aria-disabled={!hasNext || undefined}
                aria-label="Next image"
              >
                <Icon name="arrow-right" />
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
