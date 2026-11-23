import { useId, type ReactNode } from 'react';
import type { NavItem, SocialLink } from '../../content-types/navigation';
import { Container } from '../Container';
import { Grid } from '../Grid';
import { Heading } from '../Heading';
import { Icon } from '../Icon';
import { Link } from '../Link';
import { Section } from '../Section';
import styles from './Footer.module.css';

/** One footer link column: rendered as a `<nav>` labeled by its heading. */
export interface FooterColumn {
  /** Column heading (an h2), also the accessible name of the column's nav landmark. */
  heading: string;
  items: NavItem[];
}

/** Props for Footer. Every prop is optional. */
export interface FooterProps {
  /** Logo slot shown at the top. */
  logo?: ReactNode;
  /** Link columns. One column on narrow slots, two on medium, up to four on wide. */
  columns?: FooterColumn[];
  /** Social profile links, rendered as icon-only links named by each link's label. */
  social?: SocialLink[];
  /** Copyright line, policy links and similar. */
  legal?: ReactNode;
  /** Optional newsletter sign-up (or any other content) shown next to the logo. */
  newsletter?: ReactNode;
}

/** Site footer on an inverse surface. Every part is optional, so it scales down to legal-only. */
export function Footer({ logo, columns = [], social = [], legal, newsletter }: FooterProps) {
  return (
    <Section as="footer" background="inverse" padding="md">
      <Container size="xl" className={styles.inner}>
        {(logo || newsletter) && (
          <div className={styles.top}>
            {logo && <div className={styles.logo}>{logo}</div>}
            {newsletter && <div className={styles.newsletter}>{newsletter}</div>}
          </div>
        )}

        {columns.length > 0 && (
          <Grid columns={{ base: 1, sm: 2, lg: Math.min(columns.length, 4) }} gap="lg">
            {columns.map((column, index) => (
              <FooterLinks key={`${column.heading}-${index}`} column={column} />
            ))}
          </Grid>
        )}

        {(legal || social.length > 0) && (
          <div className={styles.bottom}>
            {legal && <div className={styles.legal}>{legal}</div>}
            {social.length > 0 && (
              <ul className={styles.social}>
                {social.map((link, index) => (
                  <li key={`${link.platform}-${index}`}>
                    <Link href={link.href} aria-label={link.label} externalIcon={false} className={styles.socialLink}>
                      <Icon name={link.platform} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Container>
    </Section>
  );
}

function FooterLinks({ column }: { column: FooterColumn }) {
  const headingId = useId();
  return (
    <nav aria-labelledby={headingId} className={styles.column}>
      <Heading as="h2" size="md" id={headingId}>
        {column.heading}
      </Heading>
      <ul className={styles.links}>
        {column.items.map((item, index) => (
          <li key={`${item.href}-${index}`}>
            <Link href={item.href} className={styles.link} aria-current={item.current ? 'page' : undefined}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
