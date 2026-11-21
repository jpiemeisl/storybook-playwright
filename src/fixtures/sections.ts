/*
 * Content for "Brightside Bookkeeping", a fictional small bookkeeping firm, plus edge cases.
 * Deterministic and local: no remote URLs.
 */
import type {
  ArticleCardContent,
  CardContent,
  CtaContent,
  FaqItem,
  FeatureItem,
  HeroContent,
  LogoItem,
  PricingFeature,
  PricingTier,
  StatItem,
  TestimonialContent,
} from '../component-types/sections';
import { fixtureImages, fixtureLogos, missingImageSrc } from './images';

const { heroOffice, heroDesk, standard, landscape, portrait, avatarAna, avatarMarcus } = fixtureImages;

/* Hero */

export const hero: HeroContent = {
  headline: 'Bookkeeping that keeps up with your business',
  subhead: 'Monthly books, payroll and tax-ready reports for small businesses, handled by a named accountant who answers within one working day.',
  primaryAction: { label: 'Book a free consultation', href: '/consultation' },
  secondaryAction: { label: 'See pricing', href: '/pricing' },
  media: heroOffice,
};

export const heroLongHeadline: HeroContent = {
  ...hero,
  headline:
    'Reconciled accounts, on-time payroll and tax-ready reports every single month, so you can get back to running the business you actually started',
};

export const heroDeskMedia = heroDesk;

/* Features */

export const features: FeatureItem[] = [
  { icon: 'check', title: 'Monthly reconciliation', description: 'Every bank and card account matched to receipts by the 10th of the following month.' },
  { icon: 'mail', title: 'A named accountant', description: 'One person who knows your books, reachable by email with replies within a working day.', href: '/team' },
  { icon: 'search', title: 'Receipt capture', description: 'Snap a photo or forward an email; we file it against the right transaction.' },
  { icon: 'phone', title: 'Quarterly check-ins', description: 'A 30-minute call each quarter to walk through profit, cash flow and what is coming up.' },
  { icon: 'external-link', title: 'Works with your bank', description: 'Secure read-only feeds from over 9,000 banks and card providers.' },
  { icon: 'arrow-right', title: 'Year-end handover', description: 'Tax-ready reports delivered to you or your tax preparer by mid-February.' },
];

export const featuresEdgeCases: FeatureItem[] = [
  { icon: 'check', title: 'Payroll' },
  { icon: 'mail', title: 'Sales tax filings across every state where you have economic nexus, including remote sellers', description: 'Long titles wrap without pushing the icon out of line.' },
  { title: 'No icon', description: 'Items without an icon still align with their neighbours.' },
];

/* Cards */

export const cards: CardContent[] = [
  { title: 'Cleaning up two years of books', href: '/work/cleanup', eyebrow: 'Case study', description: 'How a family-run bakery went from a shoebox of receipts to clean, reconciled accounts in six weeks.', image: standard },
  { title: 'Payroll for seasonal staff', href: '/work/seasonal-payroll', eyebrow: 'Case study', description: 'Running payroll for a garden centre that triples its headcount every spring.', image: landscape },
  { title: 'Preparing for a bank loan', href: '/work/loan', eyebrow: 'Case study', description: 'The three reports a lender asked for, and how we produced them in a week.', image: portrait },
  { title: 'Sales tax for online sellers', href: '/work/sales-tax', eyebrow: 'Guide', description: 'Which states you owe sales tax in once you start shipping nationwide.', image: heroDesk },
  { title: 'Switching from spreadsheets', href: '/work/spreadsheets', eyebrow: 'Guide', description: 'Moving a decade of spreadsheet bookkeeping into proper accounting software.', image: heroOffice },
  { title: 'Year-end checklist', href: '/work/year-end', eyebrow: 'Checklist', description: 'Eleven things to gather before your accountant asks.', image: standard },
  { title: 'Hiring your first employee', href: '/work/first-hire', eyebrow: 'Guide', description: 'Registrations, withholding and the paperwork nobody warns you about.', image: landscape },
];

export const cardEdgeCases = {
  longTitle: {
    title: 'What every small business owner should know about separating personal and business expenses before the first tax season',
    href: '/guides/separate-expenses',
    eyebrow: 'Guide',
    description: 'A long title wraps over several lines without breaking the card layout.',
    image: standard,
  },
  oneWord: { title: 'Payroll', href: '/services/payroll', description: 'Short titles keep the same card height as their row.', image: landscape },
  noImage: { title: 'No image provided', href: '/guides/no-image', eyebrow: 'Guide', description: 'Cards without an image start straight with the text.' },
  noDescription: { title: 'No description', href: '/guides/no-description', eyebrow: 'Guide', image: portrait },
  unbroken: {
    title: 'Export file',
    href: '/exports/latest',
    description: 'brightside_bookkeeping_general_ledger_export_2026_q1_all_accounts_reconciled_final_v3.csv',
    image: heroDesk,
  },
  brokenImage: {
    title: 'Image failed to load',
    href: '/guides/broken-image',
    description: 'The image fallback keeps the reserved space.',
    image: { src: missingImageSrc, alt: 'Chart of monthly expenses', width: 800, height: 450 },
  },
} satisfies Record<string, CardContent>;

/* Articles */

export const articles: ArticleCardContent[] = [
  {
    title: 'Five receipts you can stop keeping',
    href: '/blog/receipts-you-can-stop-keeping',
    excerpt: 'Digital copies are fine for most of them. Here is what the IRS actually requires.',
    category: 'Tax',
    publishedAt: '2026-03-14',
    readingTimeMinutes: 4,
    author: { name: 'Ana Ruiz', avatar: avatarAna },
    image: heroDesk,
  },
  {
    title: 'Cash flow forecasting in an afternoon',
    href: '/blog/cash-flow-forecast',
    excerpt: 'A simple 13-week forecast you can build from last month’s bank statement.',
    category: 'Planning',
    publishedAt: '2026-02-02',
    readingTimeMinutes: 7,
    author: { name: 'Marcus Webb', avatar: avatarMarcus },
    image: heroOffice,
  },
  {
    title: 'When to hire a bookkeeper',
    href: '/blog/when-to-hire',
    excerpt: 'Signs you have outgrown doing it yourself, and what it costs to hand it over.',
    category: 'Growth',
    publishedAt: '2025-11-20',
    readingTimeMinutes: 5,
    author: { name: 'Ana Ruiz', avatar: avatarAna },
    image: standard,
  },
];

export const articleEdgeCases = {
  noImage: { ...articles[0]!, title: 'Article without an image', image: undefined },
  noExcerpt: { ...articles[1]!, title: 'Article without an excerpt', excerpt: undefined },
  noAuthor: { ...articles[2]!, title: 'Article without an author', author: undefined },
  minimal: { title: 'Only the required fields', href: '/blog/minimal', publishedAt: '2026-01-05' },
} satisfies Record<string, ArticleCardContent>;

/* Media + text */

export const mediaText = {
  eyebrow: 'How it works',
  heading: 'Connect your accounts once, and we take it from there',
  body: 'Link your bank and card accounts in about ten minutes. Each month we categorise transactions, chase missing receipts and send you a one-page summary of how the business did.',
  actions: [
    { label: 'Start onboarding', href: '/onboarding' },
    { label: 'Watch a 2-minute tour', href: '/tour' },
  ],
};

/* CTA */

export const cta: CtaContent = {
  heading: 'Ready for books you don’t have to think about?',
  body: 'Book a free 30-minute consultation. We’ll look at your current setup and tell you honestly whether we can help.',
  primaryAction: { label: 'Book a consultation', href: '/consultation' },
  secondaryAction: { label: 'Email us', href: 'mailto:hello@brightside.example' },
};

/* Stats */

export const stats: StatItem[] = [
  { value: '1,200+', label: 'Small businesses served', description: 'Across retail, trades, hospitality and services.' },
  { value: '98%', label: 'Filings on time', description: 'Measured over the last three tax years.' },
  { value: '1 day', label: 'Typical reply time', description: 'From your named accountant, on working days.' },
  { value: '$0', label: 'Setup fees', description: 'For businesses with up to three accounts.' },
];

/* Testimonials */

export const testimonials: TestimonialContent[] = [
  {
    quote: 'We went from dreading month-end to barely noticing it. Ana spotted a duplicate supplier payment in the first week that more than covered the fee.',
    author: { name: 'Priya Natarajan', role: 'Owner', company: 'Copperleaf Studio', avatar: avatarAna },
    companyLogo: { ...fixtureLogos.copperleaf, alt: 'Copperleaf Studio' },
  },
  {
    quote: 'Payroll for forty seasonal staff used to take my whole Sunday. Now it just happens.',
    author: { name: 'Marcus Webb', role: 'Operations Manager', company: 'Tidewater Marine', avatar: avatarMarcus },
    companyLogo: { ...fixtureLogos.tidewater, alt: 'Tidewater Marine' },
  },
  {
    quote: 'The quarterly calls are the most useful hour of my quarter.',
    author: { name: 'Jordan Ellis', role: 'Founder', company: 'Quarry Supply Co.' },
  },
];

export const testimonialLongLabels: TestimonialContent = {
  quote: 'Our lender asked for twelve months of reconciled statements, a profit-and-loss by location and an aged receivables report with two days’ notice. Brightside had all three ready the next morning, and the loan went through a week earlier than we had planned.',
  author: {
    name: 'Alexandra Montgomery-Fairweather',
    role: 'Chief Financial and Operations Officer',
    company: 'Northwind Outfitters & Expedition Supply Cooperative',
    avatar: avatarAna,
  },
  companyLogo: { ...fixtureLogos.northwind, alt: 'Northwind Outfitters' },
};

/* Logos */

export const logos: LogoItem[] = [
  { name: 'Northwind Outfitters', image: fixtureLogos.northwind, href: '/work/northwind' },
  { name: 'Copperleaf Studio', image: fixtureLogos.copperleaf, href: '/work/copperleaf' },
  { name: 'Tidewater Marine', image: fixtureLogos.tidewater, href: '/work/tidewater' },
  { name: 'Quarry Supply Co.', image: fixtureLogos.quarry, href: '/work/quarry' },
];

/** Eight logos (marks reused under different names) to show wrapping. */
export const logosMany: LogoItem[] = [
  ...logos,
  { name: 'Harbor Lane Dental', image: fixtureLogos.tidewater },
  { name: 'Fieldstone Builders', image: fixtureLogos.quarry },
  { name: 'Maple & Rye Bakery', image: fixtureLogos.copperleaf },
  { name: 'Summit Physical Therapy', image: fixtureLogos.northwind },
];

/* FAQ */

export const faqs: FaqItem[] = [
  { id: 'switch', question: 'Can you take over from my current bookkeeper mid-year?', answer: 'Yes. We start from your last reconciled month and catch up the rest, usually within three weeks.' },
  { id: 'software', question: 'Which accounting software do you use?', answer: 'We work in QuickBooks Online and Xero. If you use something else, we’ll migrate you at no extra cost on annual plans.' },
  { id: 'taxes', question: 'Do you file my taxes?', answer: 'We prepare tax-ready reports and hand them to your tax preparer. Our Growth plan includes filing through a partner CPA.' },
  { id: 'access', question: 'Who can see my financial data?', answer: 'Only your named accountant and their reviewer. Bank feeds are read-only, and you can revoke access at any time.' },
  {
    id: 'cancel',
    question: 'What happens if I cancel?',
    answer: 'You keep full access to your books and we send a final export. There is no cancellation fee on monthly plans; annual plans are refunded pro rata.',
  },
];

/* Pricing */

const f = (label: string, included = true): PricingFeature => ({ label, included });
const usd = (amount: number) => ({ amount, currency: 'USD' });

export const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'For sole traders with simple books.',
    price: usd(0),
    interval: 'month',
    annualPrice: usd(0),
    features: [f('1 bank account'), f('Receipt capture'), f('Named accountant', false)],
    cta: { label: 'Start free', href: '/signup?plan=starter' },
  },
  {
    id: 'essentials',
    name: 'Essentials',
    description: 'Monthly bookkeeping for growing businesses.',
    price: usd(4900),
    interval: 'month',
    annualPrice: usd(47000),
    features: [f('Up to 3 bank accounts'), f('Receipt capture'), f('Named accountant'), f('Payroll', false)],
    cta: { label: 'Choose Essentials', href: '/signup?plan=essentials' },
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Books, payroll and tax filing in one plan.',
    price: usd(12900),
    interval: 'month',
    annualPrice: usd(123800),
    highlighted: true,
    badge: 'Most popular',
    features: [f('Unlimited bank accounts'), f('Receipt capture'), f('Named accountant'), f('Payroll for up to 25 people'), f('Tax filing via partner CPA')],
    cta: { label: 'Choose Growth', href: '/signup?plan=growth' },
  },
  {
    id: 'enterprise',
    name: 'Multi-location',
    description: 'For franchises and groups with several entities.',
    price: null,
    features: [f('Consolidated reporting'), f('Dedicated team'), f('Custom integrations')],
    cta: { label: 'Talk to us', href: '/contact?plan=multi' },
  },
];

const fourteen = [
  'Unlimited bank accounts', 'Receipt capture', 'Named accountant', 'Monthly close by the 10th', 'Quarterly review call',
  'Payroll for up to 25 people', 'Contractor 1099s', 'Sales tax filings', 'Tax filing via partner CPA', 'Inventory tracking',
  'Multi-currency accounts', 'Board-ready reporting pack', 'Audit support', 'Same-day priority replies',
];

export const pricingEdgeCases: PricingTier[] = [
  {
    id: 'cleanup',
    name: 'Books cleanup',
    description: 'One-off catch-up of up to five years of books.',
    price: usd(1249900),
    interval: 'one-time',
    features: [f('Up to 5 years reconciled'), f('Prior-year tax-ready reports'), f('Handover call')],
    cta: { label: 'Request a quote', href: '/cleanup' },
  },
  {
    id: 'everything',
    name: 'Everything',
    description: 'Fourteen features, to test a long list.',
    price: usd(34900),
    interval: 'month',
    highlighted: true,
    features: fourteen.map((label, index) => f(label, index < 12)),
    cta: { label: 'Choose Everything', href: '/signup?plan=everything' },
  },
  {
    id: 'custom',
    name: 'Custom',
    price: null,
    features: [f('Tailored scope'), f('Volume pricing'), f('Dedicated team')],
    cta: { label: 'Talk to us', href: '/contact' },
  },
];
