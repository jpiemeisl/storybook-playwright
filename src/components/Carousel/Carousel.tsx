import { Children, useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Icon } from '../Icon';
import styles from './Carousel.module.css';

/** Slides visible at once per container size: base (<30rem), sm (>=30rem), md (>=48rem), lg (>=64rem). */
export interface SlidesPerView {
  base?: number;
  sm?: number;
  md?: number;
  lg?: number;
}

/** Props for Carousel. */
export interface CarouselProps {
  /** Accessible name, e.g. "Customer stories". */
  label: string;
  /** One child per slide. Any content: cards, images, products. */
  children: ReactNode;
  /**
   * Slides visible at once. A number is the count for wide containers; narrower ones step down to 3, 2
   * then 1. Pass an object for exact control. Default 1.
   */
  slidesPerView?: number | SlidesPerView;
  /** Previous/next wrap around instead of stopping at the ends. */
  loop?: boolean;
  /** Show a dot button per slide. */
  showDots?: boolean;
}

function resolve(perView: number | SlidesPerView) {
  if (typeof perView === 'number') return { base: 1, sm: Math.min(perView, 2), md: Math.min(perView, 3), lg: perView };
  const base = perView.base ?? 1;
  const sm = perView.sm ?? base;
  const md = perView.md ?? sm;
  return { base, sm, md, lg: perView.lg ?? md };
}

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Scroll-snap carousel. Native horizontal scrolling (touch, trackpad, keyboard on the focusable
 * track) plus previous/next buttons and optional dots. No autoplay. Works in right-to-left layouts
 * (`dir="rtl"`): positions are measured from the inline start and the arrow icons mirror. Slides are
 * never hidden from assistive tech, so links in off-screen slides stay reachable by Tab.
 */
export function Carousel({ label, children, slidesPerView = 1, loop = false, showDots = false }: CarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const slides = Children.toArray(children);
  const count = slides.length;
  const [position, setPosition] = useState({ index: 0, leading: 0, atStart: true, atEnd: count <= 1 });
  const perView = resolve(slidesPerView);

  const measure = useCallback(() => {
    const track = trackRef.current;
    const first = track?.firstElementChild as HTMLElement | null;
    if (!track || !first) return;
    const step = first.offsetWidth + parseFloat(getComputedStyle(track).columnGap || '0');
    // Distance scrolled from the inline start. In right-to-left layouts scrollLeft runs from 0 down to
    // negative values, so use its magnitude.
    const scrolled = Math.abs(track.scrollLeft);
    const atEnd = scrolled + track.clientWidth >= track.scrollWidth - 1;
    const leading = Math.round(scrolled / step);
    setPosition({
      // At the end of the track the last slide is "current", so the last dot lights up.
      index: atEnd ? track.children.length - 1 : leading,
      // The slide actually at the inline start; Previous steps back from it (at the end it is not `index`).
      leading,
      atStart: scrolled <= 1,
      atEnd,
    });
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    measure();
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => {
      track.removeEventListener('scroll', onScroll);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [measure, count]);

  const scrollToSlide = (index: number) => {
    const track = trackRef.current;
    const slide = track?.children[index] as HTMLElement | undefined;
    if (!track || !slide) return;
    // The track is position: relative, so offsetLeft is measured from its padding edge.
    const style = getComputedStyle(track);
    const padding = parseFloat(style.paddingInlineStart || '0');
    // Right-to-left: the slide's inline start is its right edge, aligned with the track's right
    // padding; scrollLeft is 0 at the start and negative beyond it.
    const left =
      style.direction === 'rtl'
        ? slide.offsetLeft + slide.offsetWidth - track.clientWidth + padding
        : slide.offsetLeft - padding;
    track.scrollTo({ left, behavior: reducedMotion() ? 'instant' : 'smooth' });
  };

  const step = (direction: 1 | -1) => {
    if (direction === 1 && position.atEnd) return loop ? scrollToSlide(0) : undefined;
    if (direction === -1 && position.atStart) return loop ? scrollToSlide(count - 1) : undefined;
    scrollToSlide(Math.min(Math.max(position.leading + direction, 0), count - 1));
  };

  const vars = {
    '--per-view-base': perView.base,
    '--per-view-sm': perView.sm,
    '--per-view-md': perView.md,
    '--per-view-lg': perView.lg,
  } as CSSProperties;

  return (
    <section aria-roledescription="carousel" aria-label={label} className={styles.carousel} style={vars}>
      <div className={styles.controls}>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => step(-1)}
          aria-disabled={(!loop && position.atStart) || undefined}
          aria-label="Previous slide"
        >
          <Icon name="arrow-left" />
        </button>
        <button
          type="button"
          className={styles.arrow}
          onClick={() => step(1)}
          aria-disabled={(!loop && position.atEnd) || undefined}
          aria-label="Next slide"
        >
          <Icon name="arrow-right" />
        </button>
      </div>

      {/* Focusable so keyboard users can scroll it with the arrow keys. */}
      <div ref={trackRef} className={styles.track} tabIndex={0}>
        {slides.map((slide, index) => (
          <div
            key={index}
            role="group"
            aria-roledescription="slide"
            aria-label={`Slide ${index + 1} of ${count}`}
            className={styles.slide}
          >
            {slide}
          </div>
        ))}
      </div>

      {showDots && count > 1 && (
        <ol className={styles.dots}>
          {slides.map((_, index) => (
            <li key={index}>
              <button
                type="button"
                className={styles.dot}
                aria-label={`Go to slide ${index + 1}`}
                aria-current={index === position.index ? 'true' : undefined}
                onClick={() => scrollToSlide(index)}
              />
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
