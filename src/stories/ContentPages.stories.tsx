import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { AuthorByline } from '../components/AuthorByline';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { Carousel } from '../components/Carousel';
import { Card } from '../components/Card';
import { Container } from '../components/Container';
import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import { Image } from '../components/Image';
import { MediaText } from '../components/MediaText';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { RelatedPosts } from '../components/RelatedPosts';
import { Section, type SectionBackground } from '../components/Section';
import { ShareLinks } from '../components/ShareLinks';
import { Stack } from '../components/Stack';
import { Stats } from '../components/Stats';
import { Table } from '../components/Table';
import { TableOfContents } from '../components/TableOfContents';
import { Tabs } from '../components/Tabs';
import { TagList } from '../components/TagList';
import { TeamGrid } from '../components/TeamMember';
import { Text } from '../components/Text';
import { Timeline } from '../components/Timeline';
import {
  articleNode,
  articleToc,
  authors,
  relatedArticles,
  shortArticleNode,
  smallTable,
  tagsThree,
  teamEight,
  timelineFour,
} from '../fixtures/content';
import { fixtureImages } from '../fixtures/images';
import { breadcrumbTrails, footerColumns, headerCta, mainNav, socialLinks } from '../fixtures/navigation';
import { cards, stats } from '../fixtures/sections';
import styles from './ContentPages.module.css';
import { LegalContent } from './FooterContent';
import { Logo } from './Logo';

function Band({ background = 'default', children }: { background?: SectionBackground; children: ReactNode }) {
  return (
    <Section background={background} padding="md">
      <Container size="xl">{children}</Container>
    </Section>
  );
}

function SiteChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <Header logo={<Logo />} items={mainNav} cta={headerCta} sticky />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <Footer logo={<Logo />} columns={footerColumns} social={socialLinks} legal={<LegalContent />} />
    </>
  );
}

/** Blog post: breadcrumbs, header, byline, Prose with a sticky TOC beside it on wide screens, share, related. */
function BlogPost() {
  return (
    <SiteChrome>
      <Band>
        <PageHeader
          title="How to close your books in five working days"
          description="A routine for small businesses that turns month-end from a chore into numbers you can act on."
          breadcrumbs={<Breadcrumbs items={[...breadcrumbTrails.six.slice(0, 3), { label: 'Five-day close' }]} />}
          meta={<AuthorByline author={authors.ana} date="2026-03-14" readingTime="8 min read" />}
        />
      </Band>
      <Section padding="sm">
        <Container size="xl">
          <div className={styles.articleLayout}>
            <aside className={styles.toc}>
              <TableOfContents items={articleToc} activeId="day-one" />
            </aside>
            <article className={styles.article}>
              <Prose>{articleNode}</Prose>
              <Stack gap="md" className={styles.articleFooter}>
                <TagList items={tagsThree} />
                <ShareLinks url="https://brightside.example/blog/five-day-close" title="How to close your books in five working days" />
                <AuthorByline author={authors.ana} variant="block" />
              </Stack>
            </article>
          </div>
        </Container>
      </Section>
      <Band background="subtle">
        <RelatedPosts items={relatedArticles} />
      </Band>
    </SiteChrome>
  );
}

/** About page: header, media + text, stats, team grid, timeline. */
function AboutPage() {
  return (
    <SiteChrome>
      <Band>
        <PageHeader
          title="About Brightside"
          description="A small team of accountants who think month-end should be boring, in the best way."
          breadcrumbs={<Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'About' }]} />}
          variant="with-media"
          media={<Image {...fixtureImages.heroOffice} aspectRatio="4 / 3" loading="eager" />}
        />
      </Band>
      <Band background="subtle">
        <MediaText
          eyebrow="Our approach"
          heading="One named accountant, every month"
          body="Every client works with one person who knows their books. No ticket queues, no starting from scratch each time you ask a question."
          media={<Image {...fixtureImages.heroDesk} aspectRatio="4 / 3" />}
        />
      </Band>
      <Band>
        <Stats items={stats} heading="Brightside in numbers" />
      </Band>
      <Band background="subtle">
        <Stack gap="lg">
          <Text as="h2" size="xl" weight="strong">
            The team
          </Text>
          <TeamGrid members={teamEight} columns={4} />
        </Stack>
      </Band>
      <Band>
        <Stack gap="lg">
          <Text as="h2" size="xl" weight="strong">
            Our story
          </Text>
          <Timeline items={timelineFour} />
        </Stack>
      </Band>
    </SiteChrome>
  );
}

/** Prose, Table, Tabs and Carousel on one background, to prove legibility. */
function OnSurface({ background }: { background: SectionBackground }) {
  return (
    <>
      <Band background={background}>
        <Prose>{shortArticleNode}</Prose>
      </Band>
      <Band background={background}>
        <Table caption="Plans and limits" columns={smallTable.columns} rows={smallTable.rows} striped />
      </Band>
      <Band background={background}>
        <Tabs
          label="Service details"
          tabs={[
            { id: 'one', label: 'Overview', content: <Text>Monthly bookkeeping, reconciled by the 10th.</Text> },
            { id: 'two', label: 'Pricing', content: <Text>From $49 a month.</Text> },
            { id: 'three', label: 'FAQ', content: <Text>Switch plans at any time.</Text> },
          ]}
        />
      </Band>
      <Band background={background}>
        <Carousel label={`Case studies (${background})`} slidesPerView={3} showDots>
          {cards.slice(0, 5).map((card) => (
            <Card key={card.title} {...card} />
          ))}
        </Carousel>
      </Band>
    </>
  );
}

const meta = {
  title: 'Compositions/ContentPages',
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const BlogPostLayout: Story = { render: () => <BlogPost /> };
export const AboutPageLayout: Story = { render: () => <AboutPage /> };
export const ComponentsOnSubtle: Story = { render: () => <OnSurface background="subtle" /> };
export const ComponentsOnInverse: Story = { render: () => <OnSurface background="inverse" /> };
