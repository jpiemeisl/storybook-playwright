import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Container } from '../components/Container';
import { Footer } from '../components/Footer';
import { Grid } from '../components/Grid';
import { Header } from '../components/Header';
import { Heading } from '../components/Heading';
import { Pagination } from '../components/Pagination';
import { Section } from '../components/Section';
import { SkipLink } from '../components/SkipLink';
import { Stack } from '../components/Stack';
import { Text } from '../components/Text';
import {
  breadcrumbTrails,
  footerColumns,
  headerCta,
  mainNavWithCurrent,
  socialLinks,
} from '../fixtures/navigation';
import { LegalContent } from './FooterContent';
import { Logo } from './Logo';
import { NewsletterForm } from './NewsletterForm';
import { Placeholder, services } from './Placeholder';

function PageShell() {
  return (
    <>
      <SkipLink />
      <Header logo={<Logo />} items={mainNavWithCurrent} cta={headerCta} sticky />
      <main id="main" tabIndex={-1}>
        <Section padding="md">
          <Container size="xl">
            <Stack gap="md">
              <Breadcrumbs items={breadcrumbTrails.three} />
              <Heading as="h1" size="4xl">
                Design systems
              </Heading>
              <Text size="lg" tone="muted" style={{ maxInlineSize: '42rem' }}>
                Tokens, components and documentation your developers will actually use, tested for accessibility on
                every change.
              </Text>
            </Stack>
          </Container>
        </Section>
        <Section background="subtle" padding="md">
          <Container size="xl">
            <Stack gap="lg">
              <Heading size="2xl">Related services</Heading>
              <Grid columns={3}>
                {services.slice(0, 6).map((service) => (
                  <Placeholder key={service.title} title={service.title}>
                    {service.body}
                  </Placeholder>
                ))}
              </Grid>
              <Pagination currentPage={2} totalPages={8} hrefBuilder={(page) => `/services?page=${page}`} />
            </Stack>
          </Container>
        </Section>
      </main>
      <Footer
        logo={<Logo />}
        columns={footerColumns}
        social={socialLinks}
        legal={<LegalContent />}
        newsletter={<NewsletterForm />}
      />
    </>
  );
}

const meta = {
  title: 'Compositions/PageShell',
  component: PageShell,
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PageShell>;

export default meta;
type Story = StoryObj<typeof meta>;

/** SkipLink, sticky Header, main content and Footer together at 375, 768 and 1280. */
export const Default: Story = {};
