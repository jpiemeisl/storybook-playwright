import type { ReactNode } from 'react';
import { Breadcrumbs } from '../../../components/Breadcrumbs';
import { Container } from '../../../components/Container';
import { PageHeader } from '../../../components/PageHeader';
import type { SiteChrome } from '../../../content-types/chrome';
import type { BreadcrumbItem } from '../../../content-types/navigation';
import { PageSection } from '../../../registry/BlockRenderer';
import { SiteLayout } from '../../../templates/SiteLayout';
import { layoutProps } from '../../../templates/TemplateBlocks';
import { AccountNav } from '../../components/AccountNav';
import { SignedOutPrompt } from '../../components/SignedOutPrompt';
import type { AccountPage } from '../../types/account-pages';
import type { CommerceContext } from '../../types/context';
import styles from './AccountTemplates.module.css';

/** Props for AccountLayout, the shared shell around every account page. */
export interface AccountLayoutProps {
  /** The account page data; supplies the customer (null shows the sign-in prompt), navigation counts and links. */
  page: AccountPage;
  chrome: SiteChrome;
  /** Host callbacks and routing (current path for the active nav item, sign-out handler). */
  ctx?: CommerceContext;
  /** The page's h1. */
  title: string;
  description?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
  /** What a signed-out visitor is asked to sign in for, e.g. "Sign in to view your orders". */
  signedOutTitle?: string;
  children: ReactNode;
}

/**
 * The account page shell: SiteLayout, the page header (the only h1), AccountNav (a sidebar from 64rem,
 * above the content below that) and the content. Without a customer it shows SignedOutPrompt instead
 * of the navigation and content.
 */
export function AccountLayout({ page, chrome, ctx, title, description, breadcrumbs, signedOutTitle, children }: AccountLayoutProps) {
  const signedIn = !!page.customer;
  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <div className={styles.root}>
            <PageHeader title={signedIn ? title : 'Your account'} description={signedIn ? description : undefined} breadcrumbs={signedIn && breadcrumbs?.length ? <Breadcrumbs items={breadcrumbs} /> : undefined} headingLevel={1} />
            {signedIn ? (
              <div className={styles.layout}>
                <div className={styles.nav}>
                  <AccountNav currentPath={ctx?.currentPath} counts={page.nav?.counts} has={page.nav?.has} onSignOut={ctx?.onSignOut} />
                </div>
                <div className={styles.content}>{children}</div>
              </div>
            ) : (
              <SignedOutPrompt title={signedOutTitle} links={{ signIn: page.links?.login, register: page.links?.register }} />
            )}
          </div>
        </Container>
      </PageSection>
    </SiteLayout>
  );
}

/** A content section with an h2. */
export function AccountPageSection({ id, title, action, children }: { id: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={styles.section} aria-labelledby={id}>
      <div className={styles.sectionHead}>
        <h2 id={id} className={styles.sectionTitle}>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}
