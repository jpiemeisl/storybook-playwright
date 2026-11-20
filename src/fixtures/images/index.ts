/*
 * Deterministic local placeholder images for stories and visual tests.
 * Never use remote URLs in stories: they make screenshots flaky.
 */
import avatar from './avatar-1x1.svg';
import landscape from './landscape-16x9.svg';
import portrait from './portrait-3x4.svg';
import studio from './studio-4x3.svg';

export const fixtureImages = {
  square: { src: avatar, width: 400, height: 400, alt: 'Illustrated profile placeholder on a pale teal background' },
  landscape: { src: landscape, width: 1280, height: 720, alt: 'Teal mountains under a yellow sun' },
  standard: { src: studio, width: 800, height: 600, alt: 'Geometric shapes arranged on a light grey studio floor' },
  portrait: { src: portrait, width: 600, height: 800, alt: 'Framed abstract portrait on a dark wall' },
} as const;

/** Path that intentionally 404s, for failure/fallback states. */
export const missingImageSrc = '/fixtures/does-not-exist.png';
