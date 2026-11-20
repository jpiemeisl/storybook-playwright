/*
 * Deterministic navigation content for stories and visual tests.
 */
import type { FooterColumn } from '../components/Footer';
import type { BreadcrumbItem, NavItem, SocialLink } from '../content-types/navigation';

/** 5 top-level items; Services and Insights have children. */
export const mainNav: NavItem[] = [
  {
    label: 'Services',
    href: '/services',
    children: [
      { label: 'Discovery workshops', href: '/services/discovery' },
      { label: 'Design systems', href: '/services/design-systems' },
      { label: 'Accessibility audits', href: '/services/accessibility' },
      { label: 'Front-end engineering', href: '/services/engineering' },
    ],
  },
  { label: 'Work', href: '/work' },
  {
    label: 'Insights',
    href: '/insights',
    children: [
      { label: 'Articles', href: '/insights/articles' },
      { label: 'Case studies', href: '/insights/case-studies' },
      { label: 'Talks', href: '/insights/talks' },
    ],
  },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];

/** Same as mainNav, with a child page marked current. */
export const mainNavWithCurrent: NavItem[] = mainNav.map((item) =>
  item.label === 'Services'
    ? {
        ...item,
        children: item.children?.map((child) =>
          child.href === '/services/design-systems' ? { ...child, current: true } : child,
        ),
      }
    : item,
);

/** Same as mainNav, with a top-level page marked current. */
export const mainNavWithCurrentTop: NavItem[] = mainNav.map((item) =>
  item.label === 'Work' ? { ...item, current: true } : item,
);

export const shortNav: NavItem[] = [
  { label: 'Product', href: '/product' },
  { label: 'Pricing', href: '/pricing' },
  { label: 'Support', href: '/support' },
];

/** 10 items with long labels: too wide for an inline nav even at 1280px. */
export const longNav: NavItem[] = [
  { label: 'Digital transformation', href: '/digital-transformation' },
  { label: 'Customer experience', href: '/customer-experience' },
  { label: 'Data and analytics', href: '/data-analytics' },
  { label: 'Cloud infrastructure', href: '/cloud' },
  { label: 'Security and compliance', href: '/security' },
  { label: 'Industries we serve', href: '/industries' },
  { label: 'Partnerships', href: '/partners' },
  { label: 'Careers at the studio', href: '/careers' },
  { label: 'Investor relations', href: '/investors' },
  { label: 'Get in touch', href: '/contact' },
];

export const headerCta = { label: 'Book a call', href: '/contact/book' };

export const footerColumns: FooterColumn[] = [
  {
    heading: 'Services',
    items: [
      { label: 'Discovery workshops', href: '/services/discovery' },
      { label: 'Design systems', href: '/services/design-systems' },
      { label: 'Accessibility audits', href: '/services/accessibility' },
      { label: 'Front-end engineering', href: '/services/engineering' },
    ],
  },
  {
    heading: 'Company',
    items: [
      { label: 'About us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    heading: 'Resources',
    items: [
      { label: 'Articles', href: '/insights/articles' },
      { label: 'Case studies', href: '/insights/case-studies' },
      { label: 'Pattern library', href: '/patterns' },
      { label: 'Accessibility statement', href: '/accessibility' },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help centre', href: '/help' },
      { label: 'Status', href: '/status' },
      { label: 'Report an issue', href: '/help/report' },
    ],
  },
];

export const footerColumnsThree: FooterColumn[] = footerColumns.slice(0, 3);

export const socialLinks: SocialLink[] = [
  { platform: 'facebook', href: 'https://facebook.example/patternstudio', label: 'Pattern Studio on Facebook' },
  { platform: 'instagram', href: 'https://instagram.example/patternstudio', label: 'Pattern Studio on Instagram' },
  { platform: 'linkedin', href: 'https://linkedin.example/company/patternstudio', label: 'Pattern Studio on LinkedIn' },
  { platform: 'x', href: 'https://x.example/patternstudio', label: 'Pattern Studio on X' },
  { platform: 'youtube', href: 'https://youtube.example/@patternstudio', label: 'Pattern Studio on YouTube' },
  { platform: 'github', href: 'https://github.example/patternstudio', label: 'Pattern Studio on GitHub' },
];

export const legal = {
  copyright: '© 2026 Pattern Studio Ltd. Registered in England and Wales, company no. 01234567.',
  links: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookies', href: '/cookies' },
  ] satisfies NavItem[],
};

export const breadcrumbTrails = {
  one: [{ label: 'Home' }],
  two: [{ label: 'Home', href: '/' }, { label: 'Services' }],
  three: [{ label: 'Home', href: '/' }, { label: 'Services', href: '/services' }, { label: 'Design systems' }],
  six: [
    { label: 'Home', href: '/' },
    { label: 'Insights', href: '/insights' },
    { label: 'Articles', href: '/insights/articles' },
    { label: '2026', href: '/insights/articles/2026' },
    { label: 'Accessibility', href: '/insights/articles/2026/accessibility' },
    { label: 'Auditing a design system' },
  ],
  longLabels: [
    { label: 'Home', href: '/' },
    { label: 'Public sector and regulated industries', href: '/industries/public-sector' },
    { label: 'Case studies from national government departments', href: '/industries/public-sector/case-studies' },
    { label: 'Rebuilding a benefits application service to meet WCAG 2.2 AA without a big-bang launch' },
  ],
} satisfies Record<string, BreadcrumbItem[]>;
