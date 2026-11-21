/*
 * Deterministic local placeholder images for stories and visual tests.
 * Never use remote URLs in stories: they make screenshots flaky.
 */
import avatar from './avatar-1x1.svg';
import landscape from './landscape-16x9.svg';
import portrait from './portrait-3x4.svg';
import studio from './studio-4x3.svg';
import avatarAna from './avatar-ana.svg';
import avatarMarcus from './avatar-marcus.svg';
import heroDesk from './hero-desk-3x2.svg';
import heroOffice from './hero-office-16x9.svg';
import logoCopperleaf from './logo-copperleaf.svg';
import logoNorthwind from './logo-northwind.svg';
import logoQuarry from './logo-quarry.svg';
import logoTidewater from './logo-tidewater.svg';

export const fixtureImages = {
  square: { src: avatar, width: 400, height: 400, alt: 'Illustrated profile placeholder on a pale teal background' },
  landscape: { src: landscape, width: 1280, height: 720, alt: 'Teal mountains under a yellow sun' },
  standard: { src: studio, width: 800, height: 600, alt: 'Geometric shapes arranged on a light grey studio floor' },
  portrait: { src: portrait, width: 600, height: 800, alt: 'Framed abstract portrait on a dark wall' },
  heroOffice: {
    src: heroOffice,
    width: 1600,
    height: 900,
    alt: 'A tidy office with a laptop showing a chart, a wall clock and a coffee mug on the desk',
  },
  heroDesk: {
    src: heroDesk,
    width: 1200,
    height: 800,
    alt: 'Printed invoices and a calculator on a desk',
  },
  avatarAna: { src: avatarAna, width: 160, height: 160, alt: 'Ana Ruiz' },
  avatarMarcus: { src: avatarMarcus, width: 160, height: 160, alt: 'Marcus Webb' },
} as const;

/** Fictional client logos (alt text comes from the company name in LogoItem). */
export const fixtureLogos = {
  northwind: { src: logoNorthwind, width: 180, height: 48 },
  copperleaf: { src: logoCopperleaf, width: 160, height: 48 },
  tidewater: { src: logoTidewater, width: 170, height: 48 },
  quarry: { src: logoQuarry, width: 150, height: 48 },
} as const;

/** Path that intentionally 404s, for failure/fallback states. */
export const missingImageSrc = '/fixtures/does-not-exist.png';
