/*
 * DEMO ONLY. The demo shop's chrome and its content pages, as CMS-shaped JSON data (the same shapes a
 * CMS adapter produces). Blog posts reuse the core fixtures.
 */
import type { PageContent } from '../../src/content-types/blocks';
import type { SiteChrome } from '../../src/content-types/chrome';
import { catalog } from '../../src/commerce/fixtures';

const img = (name: string, alt: string) => ({ src: `/commerce/images/${name}.svg`, alt, width: 800, height: 800 });

export const shopChrome: SiteChrome = {
  header: {
    logo: { text: 'Fernhill Goods', href: '/', image: { src: '/fixtures/images/logo-mark.svg', alt: '', width: 32, height: 32 } },
    items: [
      { label: 'Shop', href: '/collections/all', children: [{ label: 'All products', href: '/collections/all' }, ...catalog.collections.map((c) => ({ label: c.title, href: `/collections/${c.handle}` }))] },
      { label: 'Club', href: '/pricing' },
      { label: 'Journal', href: '/blog' },
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
    ],
    sticky: true,
  },
  footer: {
    logo: { text: 'Fernhill Goods', href: '/' },
    columns: [
      { heading: 'Shop', items: catalog.collections.map((c) => ({ label: c.title, href: `/collections/${c.handle}` })) },
      { heading: 'Help', items: [{ label: 'Contact us', href: '/contact' }, { label: 'Your account', href: '/account' }, { label: 'Search', href: '/search' }] },
      { heading: 'Fernhill', items: [{ label: 'About', href: '/about' }, { label: 'Journal', href: '/blog' }, { label: 'Grower club', href: '/pricing' }] },
    ],
    legal: { copyright: '© 2026 Fernhill Goods (demo shop)', links: [] },
  },
} as SiteChrome;

const page = (id: string, template: string, title: string, blocks: unknown[]): PageContent => ({ id, slug: id, template, seo: { title }, blocks } as PageContent);

export const shopPages: Record<'home' | 'about' | 'pricing' | 'contact', PageContent> = {
  home: page('home', 'home', 'Fernhill Goods', [
    {
      id: 'hero',
      type: 'hero',
      headline: 'Good things for home and garden',
      subhead: 'Stoneware, seeds, tools and guides from small makers, plus a seed box that arrives every month.',
      primaryAction: { label: 'Shop all products', href: '/collections/all' },
      secondaryAction: { label: 'Join the grower club', href: '/pricing', variant: 'secondary' },
      media: img('seedbox', 'A wooden box of seed packets'),
      variant: 'split',
    },
    {
      id: 'collections',
      type: 'cardGrid',
      heading: 'Shop by collection',
      columns: 3,
      items: catalog.collections.map((c) => {
        const first = catalog.products.find((p) => p.id === c.productIds[0])!;
        return { title: c.title, description: c.description ?? `${c.productIds.length} products`, image: first.images[0], link: { label: `Shop ${c.title.toLowerCase()}`, href: `/collections/${c.handle}` } };
      }),
    },
    {
      id: 'features',
      type: 'featureGrid',
      heading: 'Why Fernhill',
      columns: 3,
      items: [
        { icon: 'truck', title: 'Free shipping over $75', description: 'Standard delivery in three to five working days.' },
        { icon: 'refresh', title: '30-day returns', description: 'Changed your mind? Send it back within 30 days.' },
        { icon: 'download', title: 'Instant downloads', description: 'Guides and templates are ready the moment you pay.' },
      ],
    },
    { id: 'cta', type: 'ctaBanner', heading: 'A seed box every month', body: 'Six seasonal varieties with growing notes. Pause or cancel any time.', primaryAction: { label: 'See the club', href: '/pricing' }, layout: 'split' },
  ]),
  about: page('about', 'about', 'About Fernhill', [
    { id: 'header', type: 'pageHeader', title: 'About Fernhill', description: 'A small shop for people who like to grow and make things.', breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'About' }] },
    { id: 'story', type: 'richText', content: { format: 'html', html: '<p>Fernhill started as a market stall selling seeds and stoneware. We still pick every product ourselves.</p><p>This is a <strong>demo shop</strong>: the products, orders and accounts are fixtures, and nothing is ever charged or shipped.</p>' } },
  ]),
  pricing: page('pricing', 'pricing', 'Grower club', [
    { id: 'header', type: 'pageHeader', title: 'Grower club', description: 'Memberships and the monthly seed box.', breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Grower club' }] },
    {
      id: 'plans',
      type: 'pricingTable',
      heading: 'Choose a membership',
      tiers: [
        { id: 'box', name: 'Seed box', description: 'Six seasonal varieties a month.', price: { amount: 1800, currency: 'USD' }, interval: 'month', features: [{ label: 'Growing notes', included: true }, { label: 'Members’ discount', included: false }], cta: { label: 'Get the seed box', href: '/products/seasonal-seed-box' } },
        { id: 'club', name: 'Grower club', description: 'Discounts, workshops and the planner app.', price: { amount: 2000, currency: 'USD' }, interval: 'month', highlighted: true, badge: 'Most popular', features: [{ label: 'Growing notes', included: true }, { label: 'Members’ discount', included: true }], cta: { label: 'Join the club', href: '/products/grower-club' } },
      ],
    },
  ]),
  contact: page('contact', 'contact', 'Contact us', [
    { id: 'header', type: 'pageHeader', title: 'Contact us', description: 'Questions about an order or a product? We reply within one working day.', breadcrumbs: [{ label: 'Home', href: '/' }, { label: 'Contact' }] },
    { id: 'form', type: 'contactForm', heading: 'Send us a message', subjectOptions: [{ value: 'order', label: 'An order' }, { value: 'product', label: 'A product' }, { value: 'other', label: 'Something else' }], consentLabel: 'I agree to Fernhill storing my details to reply to this message.' },
  ]),
};
