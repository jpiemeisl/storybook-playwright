import { useState, type CSSProperties } from 'react';
import type { GalleryImage } from '../../content-types/content';
import { Image } from '../Image';
import { Lightbox } from '../Lightbox';
import styles from './Gallery.module.css';

export interface GalleryProps {
  images: GalleryImage[];
  /** `grid`: uniform square crops. `columns`: masonry-style CSS columns with natural aspect ratios. */
  layout?: 'grid' | 'columns';
  /** Columns on wide slots; steps down to 2 on medium and 1 (columns) / 2 (grid) on narrow ones. */
  columns?: 2 | 3 | 4;
  /** Thumbnails open a Lightbox. When false they are plain images. Default true. */
  lightbox?: boolean;
  /** Accessible name for the gallery list. */
  label?: string;
}

/** Image gallery. Responsive by container width, optional Lightbox. */
export function Gallery({ images, layout = 'grid', columns = 3, lightbox = true, label = 'Gallery' }: GalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (images.length === 0) return null;

  return (
    <div className={styles.root} style={{ '--gallery-columns': columns } as CSSProperties}>
      <ul aria-label={label} className={[styles.list, styles[layout]].join(' ')}>
        {images.map((image, index) => {
          const thumbnail = (
            <Image
              {...image}
              aspectRatio={layout === 'grid' ? '1 / 1' : undefined}
              className={styles.thumbnail}
            />
          );
          return (
            <li key={image.src + index} className={styles.item}>
              <figure className={styles.figure}>
                {lightbox ? (
                  <button
                    type="button"
                    className={styles.open}
                    aria-haspopup="dialog"
                    onClick={() => setOpenIndex(index)}
                  >
                    {thumbnail}
                  </button>
                ) : (
                  thumbnail
                )}
                {image.caption && <figcaption className={styles.caption}>{image.caption}</figcaption>}
              </figure>
            </li>
          );
        })}
      </ul>
      {lightbox && (
        <Lightbox images={images} index={openIndex} onIndexChange={setOpenIndex} onClose={() => setOpenIndex(null)} />
      )}
    </div>
  );
}
