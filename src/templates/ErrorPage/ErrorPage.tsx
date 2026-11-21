import { ActionGroup } from '../../components/ActionGroup';
import { Badge } from '../../components/Badge';
import { Container } from '../../components/Container';
import { Heading } from '../../components/Heading';
import { LinkList } from '../../components/LinkList';
import { SearchInput } from '../../components/SearchInput';
import { Stack } from '../../components/Stack';
import { Text } from '../../components/Text';
import type { PageContent } from '../../content-types/blocks';
import type { ErrorPageContent } from '../../content-types/templates';
import { isObj } from '../../registry/checker';
import { PageSection } from '../../registry/BlockRenderer';
import { useGuarded } from '../guard';
import { SiteLayout } from '../SiteLayout';
import { layoutProps, TemplateBlocks } from '../TemplateBlocks';
import type { TemplateProps } from '../types';

export const canRenderErrorPage = (page: PageContent) => {
  const { error } = page as Partial<ErrorPageContent>;
  return isObj(error) && typeof error.title === 'string';
};

const codeLabel = { 404: 'Error 404: page not found', 500: 'Error 500: server error', 503: 'Error 503: temporarily unavailable' } as const;

/**
 * 404, 500 and 503 pages: code, title (the only h1), message, actions, optional search and suggested
 * links. Text carries the meaning; there is no illustration. Chrome is "default" or "minimal".
 */
export function ErrorPage({ page, chrome, ctx }: TemplateProps<ErrorPageContent>) {
  const { error } = page;
  const view = useGuarded(
    (g) => ({
      primary: g.link(error.primaryAction, 'error.primaryAction'),
      secondary: g.link(error.secondaryAction, 'error.secondaryAction'),
      links: (error.links ?? []).flatMap((link, i) => g.link(link, `error.links[${i}]`) ?? []),
      searchAction: g.href(error.searchAction, 'error.searchAction'),
    }),
    [error],
    ctx?.onError,
  );

  return (
    <SiteLayout chrome={chrome} variant={error.layout ?? 'default'} {...layoutProps(ctx)}>
      <PageSection padding="lg">
        <Container size="md">
          <Stack gap="lg">
            <Stack gap="md" align="start">
              <Badge tone="accent">{codeLabel[error.code] ?? `Error ${error.code}`}</Badge>
              <Heading as="h1" size="4xl">
                {error.title}
              </Heading>
              <Text size="lg" tone="muted">
                {error.message}
              </Text>
            </Stack>
            <ActionGroup actions={[view.primary, view.secondary]} />
            {view.searchAction && <SearchInput action={view.searchAction} name="q" label="Search the site" showSubmitButton onSearch={ctx?.onSearch} />}
            {view.links.length > 0 && (
              <Stack as="section" gap="sm" aria-labelledby="error-suggestions">
                <Heading as="h2" size="lg" id="error-suggestions">
                  You might be looking for
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
