/*
 * Content and media fixtures (Brightside Bookkeeping). Local and deterministic: no remote URLs are
 * ever loaded. External URLs below are link targets or embed URLs that are only used after a user
 * explicitly activates an embed, which the stories never do for real.
 */
import type {
  AuthorContent,
  CategoryItem,
  GalleryImage,
  MapContent,
  StepItem,
  TableColumn,
  TagItem,
  TeamMemberContent,
  TimelineItem,
  VideoContent,
} from '../component-types/content';
import type { ArticleCardContent } from '../component-types/sections';
import { fixtureImages } from './images';
import avatarJordan from './images/avatar-jordan.svg';
import avatarLee from './images/avatar-lee.svg';
import avatarSam from './images/avatar-sam.svg';
import captionsEn from './images/captions-en.vtt?url';
import bridge from './images/gallery/bridge.svg';
import desk from './images/gallery/desk.svg';
import dunes from './images/gallery/dunes.svg';
import forest from './images/gallery/forest.svg';
import harbour from './images/gallery/harbour.svg';
import kiln from './images/gallery/kiln.svg';
import lake from './images/gallery/lake.svg';
import market from './images/gallery/market.svg';
import orchard from './images/gallery/orchard.svg';
import pier from './images/gallery/pier.svg';
import studio from './images/gallery/studio.svg';
import tower from './images/gallery/tower.svg';
import videoPoster from './images/video-poster.svg';

export { articleHtml, articleNode, articleToc, shortArticleNode } from './article';

/* ---------- Authors, tags, categories ---------- */

export const authors = {
  ana: {
    name: 'Ana Ruiz',
    role: 'Senior Accountant',
    avatar: fixtureImages.avatarAna,
    href: '/team/ana-ruiz',
    bio: 'Ana leads month-end close for our retail and hospitality clients and has run more than 2,000 closes since 2015.',
  },
  noAvatar: { name: 'Jordan Ellis', role: 'Payroll Specialist', href: '/team/jordan-ellis' },
  longName: {
    name: 'Alexandra Montgomery-Fairweather-Okonkwo',
    role: 'Head of Client Onboarding and Systems Migration',
    bio: 'Alexandra moves new clients off spreadsheets and legacy software without losing a single month of history.',
  },
  minimal: { name: 'Sam' },
} satisfies Record<string, AuthorContent>;

export const tagsThree: TagItem[] = [
  { label: 'Month-end', href: '/blog/tags/month-end', count: 12 },
  { label: 'Reconciliation', href: '/blog/tags/reconciliation', count: 7 },
  { label: 'Small business', href: '/blog/tags/small-business', count: 31 },
];

export const tagsTwelve: TagItem[] = [
  ...tagsThree,
  { label: 'Payroll', href: '/blog/tags/payroll', count: 9 },
  { label: 'Sales tax', href: '/blog/tags/sales-tax', count: 5 },
  { label: 'Cash flow', href: '/blog/tags/cash-flow', count: 14 },
  { label: 'Software', href: '/blog/tags/software', count: 8 },
  { label: 'Hiring', href: '/blog/tags/hiring', count: 3 },
  { label: 'Year-end', href: '/blog/tags/year-end', count: 6 },
  { label: 'Receipts', href: '/blog/tags/receipts', count: 4 },
  { label: 'Loans', href: '/blog/tags/loans', count: 2 },
  { label: 'Inventory', href: '/blog/tags/inventory', count: 1 },
];

export const tagLongLabel: TagItem = {
  label: 'Multi-entity consolidation for franchise groups with locations in several states',
  href: '/blog/tags/multi-entity',
  count: 2,
};

export const plainTags: TagItem[] = [{ label: 'Guide' }, { label: '8 min read' }, { label: 'Updated March 2026' }];

export const categories: CategoryItem[] = [
  { id: 'all', label: 'All articles', href: '/blog', count: 86 },
  { id: 'tax', label: 'Tax', href: '/blog/tax', count: 21 },
  { id: 'payroll', label: 'Payroll', href: '/blog/payroll', count: 14 },
  { id: 'planning', label: 'Planning', href: '/blog/planning', count: 18 },
  { id: 'growth', label: 'Growth', href: '/blog/growth', count: 11 },
  { id: 'software', label: 'Software', href: '/blog/software', count: 9 },
  { id: 'news', label: 'Company news', href: '/blog/news', count: 13 },
];

/* ---------- Gallery ---------- */

const g = (src: string, width: number, height: number, alt: string, caption?: string): GalleryImage => ({ src, width, height, alt, caption });

export const galleryTwelve: GalleryImage[] = [
  g(harbour, 1200, 800, 'Harbour at dawn with a low yellow sun', 'Our first client, a harbour-side café, in 2015.'),
  g(orchard, 800, 1000, 'Orchard rows with red fruit'),
  g(desk, 1000, 1000, 'A tidy desk with a teal notebook', 'The Harbour Street office.'),
  g(dunes, 1600, 900, 'Sand dunes under a pale sky'),
  g(tower, 600, 900, 'A tall dark tower against a grey sky'),
  g(market, 1200, 900, 'A busy market stall with red awnings', 'Saturday market, one of our longest-standing clients.'),
  g(lake, 1500, 1000, 'A calm lake with teal hills'),
  g(studio, 900, 1200, 'A bright studio with grey walls'),
  g(forest, 1000, 800, 'Pine forest on a green hillside'),
  g(bridge, 1800, 800, 'A long bridge over a dark river', 'Team walk, autumn 2025.'),
  g(kiln, 800, 800, 'A pottery kiln glowing orange'),
  g(pier, 1000, 1500, 'A wooden pier reaching into calm water'),
];

export const galleryOne: GalleryImage[] = galleryTwelve.slice(0, 1);
export const galleryThree: GalleryImage[] = galleryTwelve.slice(2, 5);

/* ---------- Team ---------- */

const social = (handle: string) => [
  { platform: 'linkedin' as const, href: `https://linkedin.example/in/${handle}`, label: `${handle} on LinkedIn` },
  { platform: 'x' as const, href: `https://x.example/${handle}`, label: `${handle} on X` },
];

export const teamEight: TeamMemberContent[] = [
  { name: 'Ana Ruiz', role: 'Senior Accountant', photo: fixtureImages.avatarAna, bio: 'Leads month-end close for retail and hospitality clients.', social: social('anaruiz') },
  { name: 'Marcus Webb', role: 'Founder', photo: fixtureImages.avatarMarcus, bio: 'Started Brightside in 2015 after a decade in audit.', social: social('marcuswebb') },
  { name: 'Jordan Ellis', role: 'Payroll Specialist', photo: { src: avatarJordan, width: 400, height: 400, alt: '' }, bio: 'Runs payroll for 140 businesses and still double-checks every one.' },
  { name: 'Sam Okafor', role: 'Tax Associate', photo: { src: avatarSam, width: 400, height: 400, alt: '' }, bio: 'Sales tax, nexus and the occasional audit letter.' },
  { name: 'Lee Tanaka', role: 'Client Success', photo: { src: avatarLee, width: 400, height: 400, alt: '' }, bio: 'Your first call when something is unclear.' },
  { name: 'Priya Natarajan', role: 'Bookkeeper', bio: 'No photo yet: the card falls back to initials.' },
  {
    name: 'Alexandra Montgomery-Fairweather-Okonkwo',
    role: 'Head of Client Onboarding and Systems Migration',
    photo: fixtureImages.avatarAna,
    bio: 'Alexandra moves new clients off spreadsheets and legacy software without losing a month of history. Before Brightside she spent eight years implementing accounting systems for regional retailers, and she still keeps a spreadsheet of every migration she has ever run, just in case.',
    social: social('amfo'),
  },
  { name: 'Chris Doyle', role: 'Bookkeeper', photo: { src: avatarJordan, width: 400, height: 400, alt: '' } },
];

export const teamOne = teamEight.slice(1, 2);
export const teamThree = teamEight.slice(0, 3);

/* ---------- Timeline and steps ---------- */

export const timelineFour: TimelineItem[] = [
  { label: '2015', title: 'Founded in a spare room', description: 'Marcus starts Brightside with three clients and a borrowed laptop.' },
  { label: '2018', title: 'First office on Harbour Street', description: 'The team grows to six and takes on payroll.' },
  { label: '2022', title: '1,000 clients', description: 'Remote-first, with clients in 38 states.' },
  { label: '2026', title: 'Tax filing partnership', description: 'Growth plans now include filing through a partner CPA.' },
];

export const timelineTwelve: TimelineItem[] = [
  ...timelineFour,
  ...Array.from({ length: 8 }, (_, i) => ({
    label: `Phase ${i + 1}`,
    title:
      i === 2
        ? 'Migration of every client ledger from desktop accounting software to a cloud platform with automated bank feeds'
        : `Milestone ${i + 5}`,
    description: i % 2 === 0 ? 'A short description of what happened in this phase.' : undefined,
  })),
];

export const stepsThree: StepItem[] = [
  { title: 'Book a call', description: '30 minutes to understand your business.' },
  { title: 'Connect your accounts', description: 'Read-only bank feeds in about ten minutes.' },
  { title: 'Get your first close', description: 'Reconciled books by the 10th of next month.' },
];

export const stepsSeven: StepItem[] = [
  { title: 'Discovery call', description: 'Goals, current setup and pain points.' },
  { title: 'Proposal', description: 'Fixed monthly fee, no hourly billing.' },
  { title: 'Access', description: 'Bank feeds and software invitations.' },
  { title: 'Catch-up', description: 'Clean up any months behind.' },
  { title: 'First close', description: 'Reconciled and reviewed.' },
  { title: 'Review call', description: 'Walk through the numbers together.' },
  { title: 'Ongoing', description: 'Monthly close and quarterly check-ins.' },
];

/* ---------- Tables ---------- */

export interface PlanRow extends Record<string, React.ReactNode> {
  plan: string;
  price: string;
  accounts: string;
}

export const smallTable: { columns: TableColumn<PlanRow>[]; rows: PlanRow[] } = {
  columns: [
    { key: 'plan', header: 'Plan' },
    { key: 'price', header: 'Monthly price', numeric: true },
    { key: 'accounts', header: 'Bank accounts', align: 'center' },
  ],
  rows: [
    { plan: 'Starter', price: '$0', accounts: '1' },
    { plan: 'Essentials', price: '$49', accounts: '3' },
    { plan: 'Growth', price: '$129', accounts: 'Unlimited' },
  ],
};

const monthKeys = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'] as const;
type WideRow = Record<'location' | (typeof monthKeys)[number], string>;

export const wideTable: { columns: TableColumn<WideRow>[]; rows: WideRow[] } = {
  columns: [
    { key: 'location', header: 'Location' },
    ...monthKeys.map((key) => ({ key, header: key[0]!.toUpperCase() + key.slice(1), numeric: true })),
  ],
  rows: ['Harbour Street', 'Mill Lane', 'Online store'].map((location, r) => ({
    location,
    ...Object.fromEntries(monthKeys.map((key, i) => [key, `${(41 + r * 7 + ((i * 13 + r * 5) % 19)).toLocaleString('en-US')},${String((i * 37 + r * 11) % 1000).padStart(3, '0')}`])),
  })) as WideRow[],
};

type LedgerRow = Record<'date' | 'description' | 'account' | 'amount', string | undefined>;

/** 60 rows, with empty cells and a long text cell, for sticky-header and density stories. */
export const longTable: { columns: TableColumn<LedgerRow>[]; rows: LedgerRow[] } = {
  columns: [
    { key: 'date', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'account', header: 'Account' },
    { key: 'amount', header: 'Amount', numeric: true },
  ],
  rows: Array.from({ length: 60 }, (_, i) => ({
    date: `2026-03-${String((i % 28) + 1).padStart(2, '0')}`,
    description:
      i === 4
        ? 'Annual renewal of the point-of-sale software licence for all three locations, including the hardware support add-on and the extended warranty for the receipt printers'
        : ['Card payment', 'Supplier invoice', 'Payroll transfer', 'Customer receipt', 'Bank fee'][i % 5],
    account: i % 7 === 3 ? undefined : ['6420 Software', '5000 Cost of sales', '7000 Wages', '1200 Receivables', '7900 Bank charges'][i % 5],
    amount: i % 11 === 6 ? undefined : `${((i * 1373) % 90000 / 100 + 3.5).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
  })),
};

/* ---------- Video and map ---------- */

export const videos = {
  youtube: { provider: 'youtube', videoId: 'bS2kLx9QpE4', title: 'How a five-day close works', poster: { ...{ src: videoPoster, width: 1280, height: 720 }, alt: '' } },
  vimeo: { provider: 'vimeo', videoId: '824116523', title: 'Meet the Brightside team', poster: fixtureImages.heroOffice },
  generic: { provider: 'generic', src: 'https://video.example/embed/month-end', title: 'Month-end walkthrough (external player)' },
} satisfies Record<string, VideoContent>;

export const selfHostedVideo = {
  src: '/fixtures/month-end.mp4',
  title: 'Month-end close in two minutes',
  poster: videoPoster,
  tracks: [{ src: captionsEn, srcLang: 'en', label: 'English', default: true }],
};

export const map: MapContent = {
  src: 'https://maps.example/embed?q=12+Harbour+Street',
  title: 'Map showing Brightside Bookkeeping, 12 Harbour Street',
  address: 'Brightside Bookkeeping, 12 Harbour Street, Suite 4, Portland, ME 04101',
  directionsHref: 'https://maps.example/directions?to=12+Harbour+Street+Portland+ME',
};

/* ---------- Related posts ---------- */

export { articles as relatedArticles } from './sections';

export const extraArticle: ArticleCardContent = {
  title: 'Sales tax after your first out-of-state sale',
  href: '/blog/sales-tax-nexus',
  excerpt: 'Economic nexus explained in plain language.',
  category: 'Tax',
  publishedAt: '2026-01-19',
  readingTimeMinutes: 6,
  author: { name: 'Sam Okafor' },
  image: fixtureImages.landscape,
};

/* ---------- Small rich-text snippets ---------- */

