/*
 * Product fixtures for a fictional store, "Fernhill Goods". Local images only (/commerce/images,
 * served from src/commerce/fixtures/images). Every product passes validateProduct.
 */
import type { ImageRef } from '../../content-types/shared';
import type { Product, Variant } from '../types/product';

const usd = (amount: number) => ({ amount, currency: 'USD' });
const html = (text: string) => ({ format: 'html' as const, html: text });
const img = (name: string, width: number, height: number, alt: string): ImageRef => ({ src: `/commerce/images/${name}.svg`, alt, width, height });
const single = (id: string, amount: number, stock: Variant['stock'] = { status: 'in-stock' }, extra: Partial<Variant> = {}): Variant => ({ id, title: 'Default', optionValues: {}, price: usd(amount), stock, ...extra });
const oneTime = [{ type: 'one-time' as const }];

export const mug: Product = {
  id: 'prod-mug',
  handle: 'stoneware-mug',
  kind: 'physical',
  title: 'Stoneware mug',
  summary: 'A heavy, glazed mug that keeps coffee warm.',
  description: html('<p>Thrown by hand and glazed in moss green. Holds 350 ml. Dishwasher safe.</p>'),
  brand: 'Fernhill Studio',
  tags: ['kitchen'],
  images: [img('mug', 800, 800, 'A green stoneware mug on a pale table')],
  options: [],
  variants: [single('mug-default', 2400, { status: 'in-stock' }, { sku: 'FH-MUG', weight: 450 })],
  purchaseOptions: oneTime,
  infoSections: [{ id: 'care', title: 'Care', content: html('<p>Dishwasher and microwave safe. Hand washing keeps the glaze bright for longer.</p>') }],
  createdAt: '2025-11-02',
  rating: { average: 4.6, count: 212 },
};

const teeSizes = ['S', 'M', 'L', 'XL', 'XXL'];
const teeColours = ['Moss', 'Sand', 'Ink'];
const teeSoldOut = new Set(['S/Ink', 'M/Sand', 'XL/Moss', 'XL/Sand', 'XL/Ink']);
export const tee: Product = {
  id: 'prod-tee',
  handle: 'organic-cotton-tee',
  kind: 'physical',
  title: 'Organic cotton tee',
  summary: 'Heavyweight organic cotton in three colours.',
  description: html('<p>A relaxed fit in 220 gsm organic cotton.</p><ul><li>Pre-shrunk</li><li>Side-seam free</li></ul>'),
  brand: 'Fernhill Studio',
  tags: ['clothing'],
  images: [img('tee', 800, 1000, 'A moss green t-shirt laid flat'), img('tee', 800, 1000, 'The same t-shirt in sand')],
  // XXL is declared but exists on no variant.
  options: [
    { name: 'Size', values: teeSizes },
    { name: 'Colour', values: teeColours, display: 'swatches', swatches: { Moss: '#6b7f5a', Sand: '#d8c7a3', Ink: '#2f3a4a' } },
  ],
  sizeGuide: {
    caption: 'Organic cotton tee sizes (chest and length in cm)',
    columns: [
      { key: 'size', header: 'Size' },
      { key: 'chest', header: 'Chest', numeric: true },
      { key: 'length', header: 'Length', numeric: true },
    ],
    rows: [
      { size: 'S', chest: 96, length: 70 },
      { size: 'M', chest: 102, length: 72 },
      { size: 'L', chest: 108, length: 74 },
      { size: 'XL', chest: 114, length: 76 },
      { size: 'XXL', chest: 120, length: 78 },
    ],
  },
  infoSections: [
    { id: 'materials', title: 'Materials', content: html('<p>100% organic cotton, 220 gsm. Dyed with low-impact dyes.</p>') },
    { id: 'care', title: 'Care', content: html('<ul><li>Wash at 30°C</li><li>Do not tumble dry</li><li>Iron on medium</li></ul>') },
  ],
  createdAt: '2026-02-10',
  variants: teeSizes.slice(0, 4).flatMap((size) =>
    teeColours.map((colour) => ({
      id: `tee-${size}-${colour}`.toLowerCase(),
      sku: `FH-TEE-${size}-${colour.slice(0, 3).toUpperCase()}`,
      title: `${size} / ${colour}`,
      optionValues: { Size: size, Colour: colour },
      price: usd(3200),
      stock: teeSoldOut.has(`${size}/${colour}`) ? { status: 'out-of-stock' as const } : { status: 'in-stock' as const },
      imageIndex: colour === 'Sand' ? 1 : 0,
      weight: 220,
    })),
  ),
  purchaseOptions: oneTime,
  rating: { average: 4.3, count: 87 },
};

export const tote: Product = {
  id: 'prod-tote',
  handle: 'canvas-tote',
  kind: 'physical',
  title: 'Waxed canvas tote',
  summary: 'Water-resistant and roomy enough for a weekly shop.',
  description: html('<p>Waxed cotton canvas with leather handles.</p>'),
  images: [img('tote', 800, 800, 'A sand-coloured canvas tote bag')],
  options: [],
  variants: [single('tote-default', 1900, { status: 'in-stock' }, { compareAtPrice: usd(2500), weight: 600 })],
  purchaseOptions: oneTime,
  badges: ['Sale'],
  rating: { average: 4.8, count: 4000 },
};

export const candle: Product = {
  id: 'prod-candle',
  handle: 'beeswax-candle',
  kind: 'physical',
  title: 'Beeswax pillar candle',
  description: html('<p>Pure beeswax, about 40 hours of burn time.</p>'),
  images: [img('candle', 800, 1000, 'A cream pillar candle with a lit wick')],
  options: [],
  variants: [single('candle-default', 1800, { status: 'low-stock', quantity: 3 }, { weight: 500 })],
  purchaseOptions: oneTime,
  rating: { average: 4.1, count: 19 },
};

export const lamp: Product = {
  id: 'prod-lamp',
  handle: 'brass-desk-lamp',
  kind: 'physical',
  title: 'Brass desk lamp',
  description: html('<p>Adjustable brass shade on a weighted base.</p>'),
  images: [img('lamp', 800, 1000, 'A desk lamp with a brass shade')],
  options: [{ name: 'Finish', values: ['Brass', 'Black'], display: 'swatches', swatches: { Brass: '#c8a24a', Black: '#222222' } }],
  variants: [
    { id: 'lamp-brass', title: 'Brass', optionValues: { Finish: 'Brass' }, price: usd(8900), stock: { status: 'out-of-stock' }, weight: 2100 },
    { id: 'lamp-black', title: 'Black', optionValues: { Finish: 'Black' }, price: usd(8900), stock: { status: 'out-of-stock' }, weight: 2100 },
  ],
  purchaseOptions: oneTime,
  rating: { average: 4.4, count: 31 },
};

export const stool: Product = {
  id: 'prod-stool',
  handle: 'oak-stool',
  kind: 'physical',
  title: 'Oak stool',
  description: html('<p>Solid oak, oiled by hand. Made to order.</p>'),
  images: [img('stool', 800, 800, 'A three-legged oak stool')],
  options: [],
  variants: [single('stool-default', 14500, { status: 'backorder', availableOn: '2026-04-15' }, { weight: 4200 })],
  purchaseOptions: oneTime,
};

export const kettle: Product = {
  id: 'prod-kettle',
  handle: 'enamel-kettle',
  kind: 'physical',
  title: 'Enamel stovetop kettle',
  description: html('<p>A 1.5 litre enamel kettle for gas, electric and induction hobs.</p>'),
  images: [img('kettle', 1000, 800, 'A dark blue enamel kettle')],
  options: [],
  variants: [single('kettle-default', 6500, { status: 'preorder', availableOn: '2026-06-01' }, { weight: 1300 })],
  purchaseOptions: oneTime,
  badges: ['New'],
  createdAt: '2026-03-10',
};

export const coffee: Product = {
  id: 'prod-coffee',
  handle: 'house-coffee-beans',
  kind: 'physical',
  title: 'House coffee beans',
  summary: 'Medium roast. Subscribe and save up to 15%.',
  description: html('<p>Chocolate and hazelnut, roasted weekly.</p>'),
  images: [img('coffee', 800, 1000, 'A brown bag of coffee beans')],
  options: [{ name: 'Size', values: ['250 g', '1 kg'] }],
  variants: [
    { id: 'coffee-250', title: '250 g', optionValues: { Size: '250 g' }, price: usd(1400), stock: { status: 'in-stock' }, weight: 270 },
    { id: 'coffee-1kg', title: '1 kg', optionValues: { Size: '1 kg' }, price: usd(4600), stock: { status: 'in-stock' }, weight: 1050 },
  ],
  purchaseOptions: [
    { type: 'one-time' },
    { type: 'subscription', interval: { unit: 'week', count: 1 }, discountPercent: 10 },
    { type: 'subscription', interval: { unit: 'month', count: 1 }, discountPercent: 15 },
  ],
  rating: { average: 4.7, count: 640 },
};

export const guide: Product = {
  id: 'prod-guide',
  handle: 'small-garden-guide',
  kind: 'digital',
  title: 'The small garden guide (PDF)',
  description: html('<p>96 pages on planning, planting and harvesting in small spaces.</p>'),
  images: [img('guide', 800, 1000, 'The cover of a printed guide')],
  options: [],
  variants: [single('guide-default', 1200)],
  purchaseOptions: oneTime,
  digital: { files: [{ id: 'guide-pdf', name: 'small-garden-guide.pdf', format: 'PDF', sizeBytes: 18_400_000 }], instant: true },
  rating: { average: 4.5, count: 128 },
};

export const bundle: Product = {
  id: 'prod-bundle',
  handle: 'garden-design-bundle',
  kind: 'digital',
  title: 'Garden design template bundle',
  description: html('<p>Planting plans, seasonal checklists and printable labels.</p>'),
  images: [img('bundle', 1200, 800, 'Three overlapping template sheets')],
  options: [{ name: 'Licence', values: ['Single user', 'Team'] }],
  variants: [
    { id: 'bundle-single', title: 'Single user', optionValues: { Licence: 'Single user' }, price: usd(4900), stock: { status: 'in-stock' } },
    { id: 'bundle-team', title: 'Team', optionValues: { Licence: 'Team' }, price: usd(14900), stock: { status: 'in-stock' } },
  ],
  purchaseOptions: oneTime,
  digital: {
    files: [
      { id: 'bundle-plans', name: 'planting-plans.zip', format: 'ZIP', sizeBytes: 54_000_000, description: '24 layered plans' },
      { id: 'bundle-checklists', name: 'seasonal-checklists.pdf', format: 'PDF', sizeBytes: 3_200_000 },
      { id: 'bundle-labels', name: 'plant-labels.pdf', format: 'PDF', sizeBytes: 1_100_000 },
    ],
    licence: { type: 'team', summary: 'Use across one organisation of up to 10 people.' },
    instant: true,
    accessDays: 365,
  },
};

export const seedBox: Product = {
  id: 'prod-seed-box',
  handle: 'seasonal-seed-box',
  kind: 'subscription',
  title: 'Seasonal seed box',
  summary: 'Six varieties chosen for the month ahead.',
  description: html('<p>Seeds, sowing notes and a planting calendar every month.</p>'),
  images: [img('seedbox', 1000, 800, 'A green box with a sprouting seedling')],
  options: [],
  variants: [single('seed-box-default', 1800)],
  purchaseOptions: [{ type: 'subscription', interval: { unit: 'month', count: 1 } }],
  subscription: { cancelAnytime: true, billingNote: 'Billed on the 1st of each month.' },
  rating: { average: 4.2, count: 54 },
};

export const club: Product = {
  id: 'prod-club',
  handle: 'grower-club',
  kind: 'subscription',
  title: 'Grower club membership',
  description: html('<p>Workshops, member pricing and a quarterly magazine.</p>'),
  images: [img('seedbox', 1000, 800, 'A green box with a sprouting seedling')],
  options: [],
  variants: [single('club-default', 2000)],
  purchaseOptions: [
    { type: 'subscription', interval: { unit: 'month', count: 1 } },
    { type: 'subscription', interval: { unit: 'month', count: 3 }, priceMultiplier: 3, discountPercent: 10 },
    { type: 'subscription', interval: { unit: 'year', count: 1 }, priceMultiplier: 12, discountPercent: 20 },
  ],
  subscription: { cancelAnytime: false, minimumTermMonths: 3 },
  infoSections: [{ id: 'plan', title: 'Plan details', content: html('<p>Monthly workshops, 10% member pricing in the shop and four issues of the magazine a year.</p>') }],
};

export const plannerApp: Product = {
  id: 'prod-planner',
  handle: 'garden-planner-app',
  kind: 'subscription',
  title: 'Garden planner app',
  description: html('<p>Plan beds, track sowing and get reminders. Works offline.</p>'),
  images: [img('planner', 1280, 720, 'A tablet showing a planting schedule')],
  options: [],
  variants: [single('planner-default', 600)],
  purchaseOptions: [{ type: 'subscription', interval: { unit: 'month', count: 1 }, trialDays: 14 }],
  subscription: { cancelAnytime: true, billingNote: 'Cancel before the trial ends and you pay nothing.' },
  rating: { average: 0, count: 0 },
};

export const calendar: Product = {
  id: 'prod-calendar',
  handle: 'printable-planting-calendar',
  kind: 'digital',
  title: 'Printable planting calendar',
  description: html('<p>A free one-page calendar for the year.</p>'),
  images: [img('guide', 800, 1000, 'A printed calendar page')],
  options: [],
  variants: [single('calendar-default', 0)],
  purchaseOptions: oneTime,
  digital: { files: [{ id: 'calendar-pdf', name: 'planting-calendar.pdf', format: 'PDF', sizeBytes: 640_000 }], instant: true },
};

export const longTitle: Product = {
  id: 'prod-long',
  handle: 'long-title-planter',
  kind: 'physical',
  title: 'Extra-large self-watering terracotta and recycled-composite balcony planter with removable reservoir, trellis attachment and drainage tray',
  description: html('<p>A stress test for long titles and option names.</p>'),
  images: [img('tote', 800, 800, 'A large planter')],
  options: [
    { name: 'Reservoir capacity and drainage configuration', values: ['Standard capacity with side overflow outlet', 'Extended capacity with concealed base drainage and wicking cord'] },
  ],
  variants: [
    { id: 'long-standard', title: 'Standard capacity with side overflow outlet', optionValues: { 'Reservoir capacity and drainage configuration': 'Standard capacity with side overflow outlet' }, price: usd(7900), stock: { status: 'in-stock' }, weight: 5200 },
    { id: 'long-extended', title: 'Extended capacity with concealed base drainage and wicking cord', optionValues: { 'Reservoir capacity and drainage configuration': 'Extended capacity with concealed base drainage and wicking cord' }, price: usd(9900), stock: { status: 'in-stock' }, weight: 6100 },
  ],
  purchaseOptions: oneTime,
};

export const noImages: Product = {
  id: 'prod-twine',
  handle: 'garden-twine',
  kind: 'physical',
  title: 'Jute garden twine',
  description: html('<p>A 150 m spool of natural jute twine.</p>'),
  images: [],
  options: [],
  variants: [single('twine-default', 650, { status: 'in-stock' }, { weight: 300 })],
  purchaseOptions: oneTime,
};

const sockSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
const sockColours = ['Ink', 'Moss', 'Sand', 'Rust', 'Fog'];
export const socks: Product = {
  id: 'prod-socks',
  handle: 'merino-socks',
  kind: 'physical',
  title: 'Merino hiking socks',
  description: html('<p>Cushioned merino wool. 8 sizes, 5 colours: 40 variants.</p>'),
  images: [img('socks', 800, 800, 'A purple wool sock')],
  options: [
    { name: 'Size', values: sockSizes },
    { name: 'Colour', values: sockColours, display: 'swatches', swatches: { Ink: '#2f3a4a', Moss: '#6b7f5a', Sand: '#d8c7a3', Rust: '#a5532c', Fog: '#c9ced6' } },
  ],
  createdAt: '2026-01-20',
  variants: sockSizes.flatMap((size, i) =>
    sockColours.map((colour, j) => ({
      id: `socks-${size}-${colour}`.toLowerCase(),
      title: `${size} / ${colour}`,
      optionValues: { Size: size, Colour: colour },
      price: usd(i >= 5 ? 2400 : 2200),
      stock: (i + j) % 7 === 0 ? { status: 'out-of-stock' as const } : (i + j) % 5 === 0 ? { status: 'low-stock' as const, quantity: 2 } : { status: 'in-stock' as const },
      weight: 90,
    })),
  ),
  purchaseOptions: oneTime,
  rating: { average: 4.0, count: 9 },
};

export const seedPacket: Product = {
  id: 'prod-seed-packet',
  handle: 'basil-seed-packet',
  kind: 'physical',
  title: 'Basil seed packet',
  description: html('<p>About 200 seeds of sweet basil.</p>'),
  images: [img('seedbox', 1000, 800, 'A small seed packet')],
  options: [],
  variants: [single('seed-packet-default', 99, { status: 'in-stock' }, { weight: 10 })],
  purchaseOptions: oneTime,
};

export const diningTable: Product = {
  id: 'prod-table',
  handle: 'handmade-oak-dining-table',
  kind: 'physical',
  title: 'Handmade oak dining table',
  description: html('<p>Seats twelve. Built to order over twelve weeks.</p>'),
  images: [img('table', 1600, 900, 'A long oak dining table')],
  options: [],
  variants: [single('table-default', 1249900, { status: 'backorder', availableOn: '2026-07-01' }, { compareAtPrice: usd(1499900), weight: 95000 })],
  purchaseOptions: oneTime,
};

/** All products in catalogue order. */
export const products: Product[] = [mug, tee, tote, candle, lamp, stool, kettle, coffee, guide, bundle, seedBox, club, plannerApp, calendar, longTitle, noImages, socks, seedPacket, diningTable];
