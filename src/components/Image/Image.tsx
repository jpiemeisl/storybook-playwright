import { useState, type CSSProperties, type ReactNode } from 'react';
import styles from './Image.module.css';

export type ImageFit = 'cover' | 'contain';

/** Props handed to a `render` override, e.g. to render Next.js `<Image>` instead of `<img>`. */
export interface ImageRenderProps {
  src: string;
  alt: string;
  srcSet?: string;
  sizes?: string;
  width?: number;
  height?: number;
  loading: 'lazy' | 'eager';
  decoding: 'async';
  className: string;
  style: CSSProperties;
  onError: () => void;
}

export interface ImageProps {
  src: string;
  /** Required. Describe the image, or pass "" for a purely decorative image. */
  alt: string;
  srcSet?: string;
  sizes?: string;
  /** Intrinsic width in px; with `height` lets the browser reserve space before load. */
  width?: number;
  height?: number;
  /** CSS aspect-ratio, e.g. "16 / 9" or 1.5. Reserves space and crops via `fit`. */
  aspectRatio?: string | number;
  fit?: ImageFit;
  loading?: 'lazy' | 'eager';
  className?: string;
  /** Override the element that is rendered, e.g. a framework image component. */
  render?: (props: ImageRenderProps) => ReactNode;
}

export function Image({
  src,
  alt,
  srcSet,
  sizes,
  width,
  height,
  aspectRatio,
  fit = 'cover',
  loading = 'lazy',
  className,
  render,
}: ImageProps) {
  const [failed, setFailed] = useState(false);
  const style: CSSProperties = aspectRatio === undefined ? {} : { aspectRatio };

  if (failed) {
    const fallbackClasses = [styles.fallback, className].filter(Boolean).join(' ');
    const ratio = aspectRatio ?? (width && height ? `${width} / ${height}` : undefined);
    return alt ? (
      <div role="img" aria-label={alt} className={fallbackClasses} style={{ aspectRatio: ratio }}>
        <span className={styles.fallbackText} aria-hidden="true">
          {alt}
        </span>
      </div>
    ) : (
      <div aria-hidden="true" className={fallbackClasses} style={{ aspectRatio: ratio }} />
    );
  }

  const props: ImageRenderProps = {
    src,
    alt,
    srcSet,
    sizes,
    width,
    height,
    loading,
    decoding: 'async',
    className: [styles.image, styles[fit], className].filter(Boolean).join(' '),
    style,
    onError: () => setFailed(true),
  };

  return render ? render(props) : <img {...props} />;
}
