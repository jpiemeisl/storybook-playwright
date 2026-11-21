/*
 * Customers, the downloads library, address books and wishlists for the account area.
 */
import type { Customer, LibraryItem, SavedAddress, WishlistItem } from '../../types/account';
import { catalog48 } from '../browsing';
import { products } from '../products';

export const customers = {
  robin: { id: 'cus-1', name: 'Robin Vale', email: 'robin@example.com', createdAt: '2024-02-11T10:00:00Z' },
  longName: { id: 'cus-2', name: 'Maximiliana Alexandrina Featherstonehaugh-Montgomery-Worthington', email: 'maximiliana.featherstonehaugh-montgomery@extraordinarily-long-domain-name.example', createdAt: '2025-08-30T16:20:00Z' },
} satisfies Record<string, Customer>;

const pdf = (fileId: string, name: string, sizeBytes: number) => ({ fileId, name, available: true, format: 'PDF', sizeBytes });

const guide: LibraryItem = { productId: 'prod-guide', productTitle: 'The small garden guide (PDF)', orderId: 'ord-1003', orderNumber: 'FH-1003', purchasedAt: '2026-03-18T20:10:00Z', files: [pdf('guide-pdf', 'small-garden-guide.pdf', 18_400_000)], licence: { type: 'single', summary: 'Personal use on your own devices.' } };
const bundle: LibraryItem = {
  productId: 'prod-bundle',
  productTitle: 'Garden design template bundle',
  orderId: 'ord-1003',
  orderNumber: 'FH-1003',
  purchasedAt: '2026-03-18T20:10:00Z',
  files: [
    { fileId: 'bundle-plans', name: 'planting-plans.zip', available: true, format: 'ZIP', sizeBytes: 54_000_000, expiresAt: '2027-03-18' },
    pdf('bundle-checklists', 'seasonal-checklists.pdf', 3_200_000),
    pdf('bundle-labels', 'plant-labels.pdf', 1_100_000),
  ],
  licence: { type: 'team', summary: 'Up to 5 people in one business.' },
  licenseKey: 'GDTB-7Q4M-K2XP-9VNA',
};
const calendar: LibraryItem = { productId: 'prod-calendar', productTitle: 'Printable planting calendar', orderId: 'ord-0970', orderNumber: 'FH-0970', purchasedAt: '2025-12-01T08:00:00Z', files: [pdf('calendar-pdf', 'planting-calendar.pdf', 640_000)] };
const course: LibraryItem = {
  productId: 'prod-pruning-course',
  productTitle: 'Pruning masterclass (video course)',
  orderId: 'ord-0942',
  orderNumber: 'FH-0942',
  purchasedAt: '2025-03-02T12:00:00Z',
  files: [
    { fileId: 'course-1', name: 'pruning-01-tools.mp4', available: false, format: 'MP4', sizeBytes: 420_000_000, expiresAt: '2026-03-02', reason: 'Link expired on Mar 2, 2026. Contact us and we’ll send a new one.' },
    { fileId: 'course-2', name: 'pruning-02-fruit-trees.mp4', available: false, format: 'MP4', sizeBytes: 610_000_000, expiresAt: '2026-03-02', reason: 'Link expired on Mar 2, 2026. Contact us and we’ll send a new one.' },
  ],
  licence: { type: 'single', summary: 'Streaming and download for one person, 12 months.' },
};
const soundscape: LibraryItem = {
  productId: 'prod-soundscape',
  productTitle: 'Dawn chorus field recordings',
  orderId: 'ord-0955',
  orderNumber: 'FH-0955',
  purchasedAt: '2025-06-21T05:30:00Z',
  files: [
    { fileId: 'sound-1', name: 'dawn-chorus-side-a.mp3', available: true, format: 'MP3', sizeBytes: 96_500_000 },
    { fileId: 'sound-2', name: 'dawn-chorus-side-b.mp3', available: false, format: 'MP3', sizeBytes: 88_100_000, reason: 'Being re-mastered. Available again from Apr 1, 2026.' },
  ],
  licence: { type: 'unlimited', summary: 'Use in any project, including commercial work.' },
  licenseKey: 'DAWN-CHOR-US22-0621',
};
const planner: LibraryItem = { productId: 'prod-planner-export', productTitle: 'Garden planner app: data export', orderId: 'ord-1010', orderNumber: 'FH-1010', purchasedAt: '2026-03-14T09:00:00Z', files: [{ fileId: 'planner-csv', name: 'my-garden-2026.csv', available: true, format: 'CSV', sizeBytes: 48_000 }] };

export const libraries = {
  none: [] as LibraryItem[],
  one: [guide],
  /** Six products: bundles, expired and unavailable files, licence keys. */
  six: [guide, bundle, calendar, course, soundscape, planner],
};

const address = (id: string, label: string, a: Omit<SavedAddress, 'id' | 'label' | 'country'>): SavedAddress => ({ id, label, country: 'US', ...a });

const home = address('adr-1', 'Home', { name: 'Robin Vale', line1: '14 Alder Row', city: 'Portland', region: 'OR', postalCode: '97201', phone: '503 555 0142', isDefaultShipping: true, isDefaultBilling: true });
const office = address('adr-2', 'Studio', { name: 'Robin Vale', company: 'Quarry Lane Studio', line1: '200 Mill Street', line2: 'Suite 4', city: 'Portland', region: 'OR', postalCode: '97209' });
const parents = address('adr-3', 'Parents', { name: 'Alex and Sam Vale', line1: '88 Orchard Lane', line2: 'Apt 2B', city: 'Bend', region: 'OR', postalCode: '97701-3412' });
const long = address('adr-4', 'Very long label for the holiday cottage by the lake', {
  name: 'Maximiliana Alexandrina Featherstonehaugh-Montgomery-Worthington',
  company: 'The Extraordinarily Long Company Name Horticultural Supply Cooperative, Incorporated',
  line1: '123456 North Saint Christopher Columbus Memorial Parkway Extension',
  line2: 'Building 14, Floor 27, Suite 2700-B, Attention Receiving Department',
  city: 'Rancho Santa Margarita',
  region: 'CA',
  postalCode: '92688-1234',
});
const extra = ['Seattle WA 98101', 'Austin TX 78701', 'Denver CO 80202', 'Boston MA 02108', 'Chicago IL 60601', 'Miami FL 33130'].map((place, i) => {
  const [city, region, postalCode] = [place.split(' ').slice(0, -2).join(' '), place.split(' ').at(-2)!, place.split(' ').at(-1)!];
  return address(`adr-${5 + i}`, `Friend ${i + 1}`, { name: `Friend ${i + 1}`, line1: `${100 + i * 11} Main Street`, city, region, postalCode });
});

export const addressBooks = {
  none: [] as SavedAddress[],
  one: [home],
  three: [home, office, parents],
  /** Exactly MAX_ADDRESSES (10), with long names and apartment lines. */
  ten: [home, office, parents, long, ...extra],
};

const item = (productId: string, addedAt: string): WishlistItem => ({ productId, addedAt });
const many = [...products.map((p) => p.id), ...catalog48.map((p) => p.id)];

export const wishlists = {
  none: [] as WishlistItem[],
  three: [item('prod-tote', '2026-03-10T12:00:00Z'), item('prod-lamp', '2026-03-02T09:00:00Z'), item('prod-guide', '2026-02-20T18:30:00Z')],
  /** Fourteen, including the out-of-stock lamp and sold-out sizes. */
  fourteen: ['prod-lamp', 'prod-tee', ...many.filter((id) => id !== 'prod-lamp' && id !== 'prod-tee')].slice(0, 14).map((id, i) => item(id, `2026-03-${String(20 - i).padStart(2, '0')}T10:00:00Z`)),
};

/** Every product a wishlist fixture refers to, for page data. */
export const wishlistProducts = [...products, ...catalog48];
