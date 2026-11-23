import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { AnnouncementBar } from '../../components/AnnouncementBar';
import { Footer } from '../../components/Footer';
import { Header } from '../../components/Header';
import { LinkList } from '../../components/LinkList';
import { NewsletterSignup } from '../../components/NewsletterSignup';
import { SiteLogo } from '../../components/SiteLogo';
import { SkipLink } from '../../components/SkipLink';
import { Stack } from '../../components/Stack';
import { Text } from '../../components/Text';
import type { SiteChrome } from '../../content-types/chrome';
import type { ValidationIssue } from '../../registry/checker';
import type { FormHandlers } from '../../registry/types';
import { chromeToProps, type ChromeProps } from '../chromeToProps';
import styles from './SiteLayout.module.css';

/** How much chrome SiteLayout shows: `default` (full header and footer), `minimal` (logo-only header, legal-only footer) or `bare` (none). */
export type SiteLayoutVariant = 'default' | 'minimal' | 'bare';

/** Props for SiteLayout: the site chrome content, the layout variant, the current path, the page content and optional handlers. */
export interface SiteLayoutProps {
  /** Header, footer and announcement content. */
  chrome: SiteChrome;
  /**
   * `default`: full header and footer. `minimal`: logo-only header (no navigation) and a legal-only
   * footer, for landing pages and checkout. `bare`: no header or footer, for embeds and previews.
   */
  variant?: SiteLayoutVariant;
  /** Path of the page being viewed; marks the matching nav item with aria-current="page". */
  currentPath?: string;
  children: ReactNode;
  /** Called for links or images in the chrome that were refused. */
  onError?: (issue: ValidationIssue) => void;
  /** Controlled announcement dismissal. Uncontrolled (in memory) when omitted. */
  announcementDismissed?: boolean;
  onAnnouncementDismiss?: () => void;
  /** Makes chrome.footer.newsletter a working form. Without it the footer newsletter is not shown. */
  newsletter?: FormHandlers['newsletter'];
  /** Controls shown in the header at every width (e.g. search, account and cart), from the host. Not in `minimal`. */
  headerActions?: ReactNode;
}

/**
 * The page shell: skip link, optional announcement, header, a single <main id="main"> and footer.
 * Exactly one banner, main and contentinfo landmark (none of the first and last for `bare`).
 */
export function SiteLayout({
  chrome,
  variant = 'default',
  currentPath,
  children,
  onError,
  announcementDismissed,
  onAnnouncementDismiss,
  newsletter,
  headerActions,
}: SiteLayoutProps) {
  const { props, issues } = useMemo(() => {
    const found: ValidationIssue[] = [];
    return { props: chromeToProps(chrome, { currentPath, onIssue: (issue) => found.push(issue) }), issues: found };
  }, [chrome, currentPath]);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  useEffect(() => issues.forEach((issue) => onErrorRef.current?.(issue)), [issues]);

  const full = variant === 'default';
  const { header, footer, announcement } = props;

  const dismiss = () => {
    onAnnouncementDismiss?.();
    // The dismiss button disappears with the bar; continue from the start of the page content.
    document.getElementById('main')?.focus();
  };

  return (
    <>
      <SkipLink targetId="main" />
      {variant !== 'bare' && (
        <div className={styles.chrome}>
          {full && announcement && <AnnouncementBar {...announcement} dismissed={announcementDismissed} onDismiss={dismiss} />}
          <Header logo={<SiteLogo {...header.logo} />} items={full ? header.items : []} cta={full ? header.cta : undefined} actions={full ? headerActions : undefined} sticky={header.sticky} />
        </div>
      )}
      <main id="main" tabIndex={-1} className={styles.main}>
        {children}
      </main>
      {variant !== 'bare' && (
        <div className={styles.chrome}>
          <Footer
            logo={full && footer.logo ? <SiteLogo {...footer.logo} /> : undefined}
            columns={full ? footer.columns : []}
            social={full ? footer.social : []}
            legal={<FooterLegal legal={footer.legal} />}
            newsletter={full && footer.newsletter && newsletter ? <FooterNewsletter content={footer.newsletter} handlers={newsletter} /> : undefined}
          />
        </div>
      )}
    </>
  );
}

function FooterLegal({ legal }: { legal: ChromeProps['footer']['legal'] }) {
  return (
    <Stack direction="row" gap="md" align="center" wrap>
      <Text as="span" size="sm" tone="muted">
        {legal.copyright}
      </Text>
      <LinkList items={legal.links} direction="row" size="sm" label="Legal" />
    </Stack>
  );
}

function FooterNewsletter({ content, handlers }: { content: NonNullable<ChromeProps['footer']['newsletter']>; handlers: NonNullable<FormHandlers['newsletter']> }) {
  return (
    <Stack gap="sm">
      {content.heading && (
        <Text weight="strong" size="lg">
          {content.heading}
        </Text>
      )}
      <NewsletterSignup {...handlers} consentLabel={content.consentLabel} />
    </Stack>
  );
}
