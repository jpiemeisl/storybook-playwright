import { describe, expect, it } from 'vitest';
import type { SiteChrome } from '../content-types/chrome';
import type { ValidationIssue } from '../registry/checker';
import { chromeToProps } from './chromeToProps';

const chrome: SiteChrome = {
  header: {
    logo: { text: 'Brightside', href: '/', image: { src: '/logo.svg', alt: 'Brightside logo', width: 32, height: 32 } },
    items: [
      { label: 'Services', href: '/services', children: [{ label: 'Payroll', href: '/services/payroll' }, { label: 'Bad', href: 'javascript:alert(1)' }] },
      { label: 'Blog', href: '/blog' },
      { label: 'Evil', href: ' JaVaScRiPt:alert(1)' },
    ],
    cta: { label: 'Book a call', href: '/book' },
    sticky: true,
  },
  footer: {
    columns: [{ heading: 'Company', items: [{ label: 'About', href: '/about' }, { label: 'Data', href: 'data:text/html,x' }] }],
    social: [
      { platform: 'linkedin', href: 'https://linkedin.example/brightside', label: 'Brightside on LinkedIn' },
      { platform: 'x', href: 'javascript:void(0)', label: 'Brightside on X' },
    ],
    legal: { copyright: '© 2026 Brightside', links: [{ label: 'Privacy', href: '/legal/privacy' }, { label: 'Terms', href: 'vbscript:x' }] },
  },
  announcement: { message: 'New: payroll for seasonal teams.', link: { label: 'Learn more', href: '/payroll' }, tone: 'inverse', dismissible: true },
};

describe('chromeToProps', () => {
  it('maps the logo ImageRef to a decorative image beside the text', () => {
    const { header } = chromeToProps(chrome);
    expect(header.logo).toEqual({ text: 'Brightside', href: '/', image: { src: '/logo.svg', alt: '', width: 32, height: 32 } });
    expect(header.sticky).toBe(true);
    expect(header.cta).toEqual({ label: 'Book a call', href: '/book' });
  });

  it('refuses unsafe links everywhere and reports each one', () => {
    const issues: ValidationIssue[] = [];
    const props = chromeToProps(chrome, { onIssue: (issue) => issues.push(issue) });
    expect(props.header.items.map((item) => item.label)).toEqual(['Services', 'Blog']);
    expect(props.header.items[0]?.children?.map((item) => item.label)).toEqual(['Payroll']);
    expect(props.footer.columns[0]?.items.map((item) => item.label)).toEqual(['About']);
    expect(props.footer.social.map((item) => item.platform)).toEqual(['linkedin']);
    expect(props.footer.legal.links).toEqual([{ label: 'Privacy', href: '/legal/privacy' }]);
    expect(issues.map((issue) => issue.path).sort()).toEqual(
      ['footer.columns[0].items[1].href', 'footer.legal.links[1].href', 'footer.social[1].href', 'header.items[0].children[1].href', 'header.items[2].href'].sort(),
    );
    expect(new Set(issues.map((issue) => issue.code))).toEqual(new Set(['unsafe-href']));
  });

  it('refuses an unsafe logo link and image', () => {
    const issues: ValidationIssue[] = [];
    const props = chromeToProps(
      { ...chrome, header: { ...chrome.header, logo: { text: 'B', href: 'javascript:x', image: { src: 'data:image/svg+xml,x', alt: '' } } } },
      { onIssue: (issue) => issues.push(issue) },
    );
    expect(props.header.logo).toEqual({ text: 'B', href: '/' });
    expect(issues.filter((issue) => issue.path.startsWith('header.logo')).map((issue) => issue.code).sort()).toEqual(['unsafe-href', 'unsafe-src']);
  });

  it('marks the current header item (prefix) and footer link (exact)', () => {
    const props = chromeToProps(chrome, { currentPath: '/about' });
    expect(props.footer.columns[0]?.items[0]?.current).toBe(true);
    const nested = chromeToProps(chrome, { currentPath: '/blog/five-day-close' });
    expect(nested.header.items.find((item) => item.current)?.label).toBe('Blog');
  });

  it('maps the announcement, dropping an unsafe link but keeping the message', () => {
    expect(chromeToProps(chrome).announcement).toEqual({ message: 'New: payroll for seasonal teams.', tone: 'inverse', dismissible: true, link: { label: 'Learn more', href: '/payroll' } });
    const unsafe = chromeToProps({ ...chrome, announcement: { message: 'Hi', link: { label: 'x', href: 'javascript:x' } } });
    expect(unsafe.announcement).toEqual({ message: 'Hi', tone: 'accent', dismissible: false });
    expect(chromeToProps({ ...chrome, announcement: undefined }).announcement).toBeUndefined();
  });
});
