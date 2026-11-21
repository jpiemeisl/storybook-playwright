import { Container } from '../../components/Container';
import { DescriptionList } from '../../components/DescriptionList';
import { Image } from '../../components/Image';
import { PrevNextNav } from '../../components/PrevNextNav';
import { Stack } from '../../components/Stack';
import { Stats } from '../../components/Stats';
import type { PageContent } from '../../content-types/blocks';
import type { CaseStudyPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { ListingHeader } from '../ListingHeader';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

export const canRenderCaseStudy = (page: PageContent) => {
  const { caseStudy } = page as Partial<CaseStudyPage>;
  return isObj(caseStudy) && typeof caseStudy.title === 'string' && Array.isArray(caseStudy.body);
};

/**
 * Case study: header (h1) with client, industry and services as a description list, hero image,
 * results as stats, the body blocks as page sections, previous/next links, then the page's blocks.
 */
export function CaseStudy({ page, chrome, ctx }: TemplateProps<CaseStudyPage>) {
  const { caseStudy } = page;
  const view = useGuarded(
    (g) => ({
      hero: g.image(caseStudy.heroImage, 'caseStudy.heroImage'),
      previous: g.link(caseStudy.previous, 'caseStudy.previous'),
      next: g.link(caseStudy.next, 'caseStudy.next'),
    }),
    [caseStudy],
    ctx?.onError,
  );
  const facts = [
    { term: 'Client', details: caseStudy.client },
    ...(caseStudy.industry ? [{ term: 'Industry', details: caseStudy.industry }] : []),
    ...(caseStudy.services?.length ? [{ term: 'Services', details: caseStudy.services.join(', ') }] : []),
  ];

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection>
        <Container size="xl">
          <Stack gap="xl">
            <ListingHeader heading={{ title: caseStudy.title, description: caseStudy.summary, breadcrumbs: caseStudy.breadcrumbs }} />
            <DescriptionList items={facts} />
            {view.hero && <Image {...view.hero} aspectRatio="16 / 9" loading="eager" />}
          </Stack>
        </Container>
      </PageSection>
      {caseStudy.results?.length ? (
        <PageSection background="subtle">
          <Container size="xl">
            <Stats heading="Results" items={caseStudy.results} headingLevel={2} />
          </Container>
        </PageSection>
      ) : null}
      <TemplateBlocks blocks={caseStudy.body} ctx={ctx} h1Provided />
      {(view.previous || view.next) && (
        <PageSection>
          <Container size="xl">
            <PrevNextNav
              previous={view.previous && { title: view.previous.label, href: view.previous.href }}
              next={view.next && { title: view.next.label, href: view.next.href }}
              previousLabel="Previous case study"
              nextLabel="Next case study"
              aria-label="More case studies"
            />
          </Container>
        </PageSection>
      )}
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
