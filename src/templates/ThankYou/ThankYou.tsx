import { ActionGroup } from '../../components/ActionGroup';
import { Container } from '../../components/Container';
import { Heading } from '../../components/Heading';
import { LinkList } from '../../components/LinkList';
import { Stack } from '../../components/Stack';
import { Text } from '../../components/Text';
import { Steps } from '../../components/Timeline';
import type { PageContent } from '../../content-types/blocks';
import type { ThankYouPage } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

export const canRenderThankYou = (page: PageContent) => {
  const { thankYou } = page as Partial<ThankYouPage>;
  return isObj(thankYou) && typeof thankYou.title === 'string';
};

/** Confirmation after a form: title (h1), message, "What happens next" steps, actions and related links. */
export function ThankYou({ page, chrome, ctx }: TemplateProps<ThankYouPage>) {
  const { thankYou } = page;
  const view = useGuarded(
    (g) => ({
      actions: (thankYou.actions ?? []).map((action, i) => g.link(action, `thankYou.actions[${i}]`)),
      links: (thankYou.links ?? []).flatMap((link, i) => g.link(link, `thankYou.links[${i}]`) ?? []),
    }),
    [thankYou],
    ctx?.onError,
  );

  return (
    <SiteLayout chrome={chrome} {...layoutProps(ctx)}>
      <PageSection padding="lg">
        <Container size="md">
          <Stack gap="xl">
            <Stack gap="md">
              <Heading as="h1" size="4xl">
                {thankYou.title}
              </Heading>
              <Text size="lg" tone="muted">
                {thankYou.message}
              </Text>
            </Stack>
            {thankYou.steps?.length ? (
              <Stack as="section" gap="lg" aria-labelledby="next-steps">
                <Heading as="h2" size="xl" id="next-steps">
                  What happens next
                </Heading>
                <Steps items={thankYou.steps} headingLevel={3} />
              </Stack>
            ) : null}
            <ActionGroup actions={view.actions} />
            {view.links.length > 0 && (
              <Stack as="section" gap="sm" aria-labelledby="related-links">
                <Heading as="h2" size="lg" id="related-links">
                  You might also like
                </Heading>
                <LinkList items={view.links} />
              </Stack>
            )}
          </Stack>
        </Container>
      </PageSection>
      <TemplateBlocks blocks={page.blocks} ctx={ctx} h1Provided />
    </SiteLayout>
  );
}
