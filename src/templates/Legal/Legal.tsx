import { Container } from '../../components/Container';
import { Prose } from '../../components/Prose';
import { SidebarLayout } from '../../components/SidebarLayout';
import { Stack } from '../../components/Stack';
import { TableOfContents } from '../../components/TableOfContents';
import { Text } from '../../components/Text';
import type { PageContent } from '../../content-types/blocks';
import type { LegalPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { neutralizeUnsafeUrls } from '../../registry/links';
import { formatIsoDate } from '../../utils/formatDate';
import { useGuarded } from '../guard';
import { ListingHeader } from '../ListingHeader';
import { prepareHtml, reservedIds } from '../prose';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';
import styles from './Legal.module.css';

export const canRenderLegal = (page: PageContent) => {
  const { legal } = page as Partial<LegalPage>;
  return isObj(legal) && typeof legal.title === 'string' && isObj(legal.body) && typeof legal.body.html === 'string';
};

/**
 * Legal text (privacy policy, terms): header (h1) with the last-updated date, the text beside a sticky
 * table of contents, and print styles (no chrome or TOC, link URLs printed after the link text).
 */
export function Legal({ page, chrome, ctx }: TemplateProps<LegalPage>) {
  const { legal } = page;
  const view = useGuarded(
    (g) => {
      const { html, removed } = neutralizeUnsafeUrls(legal.body.html);
      removed.forEach((value) => g.issues.push({ code: 'unsafe-href', severity: 'error', message: `Link target ${JSON.stringify(value)} was removed.`, path: 'legal.body.html' }));
      return prepareHtml(html, reservedIds(page.blocks));
    },
    [page],
    ctx?.onError,
  );

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <Stack gap="xl">
            <ListingHeader
              heading={{ title: legal.title, description: legal.intro, breadcrumbs: legal.breadcrumbs }}
              meta={
                <Text size="sm" tone="muted">
                  Last updated <time dateTime={legal.lastUpdated}>{formatIsoDate(legal.lastUpdated)}</time>
                </Text>
              }
            />
            <SidebarLayout aside={view.toc.length > 0 ? <TableOfContents items={view.toc} /> : undefined}>
              <Prose sanitizedHtml={view.html} className={styles.body} />
            </SidebarLayout>
          </Stack>
        </Container>
      </PageSection>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
