import type { PromoCode, ShippingMethod } from '../types/cart';
import type { Address } from '../types/order';

const usd = (amount: number) => ({ amount, currency: 'USD' });

export const shippingMethods: ShippingMethod[] = [
  { id: 'ship-standard', label: 'Standard', description: 'Tracked delivery', price: usd(595), estimate: '3-5 working days' },
  { id: 'ship-express', label: 'Express', description: 'Next working day if ordered by 2pm', price: usd(1495), estimate: '1 working day' },
  { id: 'ship-pickup', label: 'Collect in store', description: 'From our Portland workshop', price: usd(0), estimate: 'Ready in 2 hours' },
];

export const promoDefinitions: PromoCode[] = [
  { code: 'WELCOME10', kind: 'percent', value: 10, description: '10% off your first order' },
  { code: 'FIVEOFF', kind: 'fixed', value: 500, minSubtotal: 2500, description: '$5 off orders over $25' },
  { code: 'SHIPFREE', kind: 'free-shipping', description: 'Free standard shipping' },
];

export const addresses: Record<'home' | 'work', Address> = {
  home: { name: 'Robin Vale', line1: '14 Alder Row', city: 'Portland', region: 'OR', postalCode: '97201', country: 'US', phone: '+1 503 555 0142' },
  work: { name: 'Robin Vale', company: 'Quarry Lane Studio', line1: '200 Mill Street', line2: 'Suite 4', city: 'Portland', region: 'OR', postalCode: '97209', country: 'US' },
};

/** The fixed "now" used by the demo cart and fixture totals: screenshots never depend on the clock. */
export const DEMO_NOW = '2026-03-21T09:00:00Z';
