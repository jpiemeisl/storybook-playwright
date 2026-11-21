import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';
import { FaqSection } from '../components/Accordion';
import { Card, CardGrid } from '../components/Card';
import { Container } from '../components/Container';
import { CtaBanner } from '../components/CtaBanner';
import { FeatureGrid } from '../components/FeatureGrid';
import { Hero } from '../components/Hero';
import { Image } from '../components/Image';
import { LogoStrip } from '../components/LogoStrip';
import { MediaText } from '../components/MediaText';
import { PricingTable } from '../components/PricingTable';
import { Section, type SectionBackground } from '../components/Section';
import { Stats } from '../components/Stats';
import { TestimonialGrid } from '../components/Testimonial';
import { fixtureImages } from '../fixtures/images';
import {
  cards,
  cta,
  faqs,
  features,
  hero,
  logos,
  mediaText,
  pricingTiers,
  stats,
  testimonials,
} from '../fixtures/sections';

/*
 * Every content section stacked on one Section background. Contrast problems surface here:
 * the a11y gate in `npm run test:vrt` runs axe on each story at every viewport.
 * Split in two halves per background to keep full-page screenshots a manageable height.
 */

function Band({ background, children }: { background: SectionBackground; children: ReactNode }) {
  return (
    <Section background={background} padding="md">
      <Container size="xl">{children}</Container>
    </Section>
  );
}

function PartOne({ background }: { background: SectionBackground }) {
  return (
    <>
      <Band background={background}>
        <Hero {...hero} variant="split" media={fixtureImages.heroDesk} />
      </Band>
      <Band background={background}>
        <FeatureGrid items={features.slice(0, 3)} heading="What you get" headingLevel={2} />
      </Band>
      <Band background={background}>
        <CardGrid>
          {cards.slice(0, 3).map((card) => (
            <Card key={card.title} {...card} />
          ))}
        </CardGrid>
      </Band>
      <Band background={background}>
        <MediaText {...mediaText} media={<Image {...fixtureImages.heroOffice} aspectRatio="16 / 9" />} />
      </Band>
      <Band background={background}>
        <Stats items={stats} heading="Brightside in numbers" />
      </Band>
    </>
  );
}

function PartTwo({ background }: { background: SectionBackground }) {
  return (
    <>
      <Band background={background}>
        <LogoStrip items={logos} heading="Trusted by 1,200 small businesses" />
      </Band>
      <Band background={background}>
        <TestimonialGrid items={testimonials} />
      </Band>
      <Band background={background}>
        <PricingTable tiers={pricingTiers} annualSavingsLabel="Save 20%" headingLevel={2} />
      </Band>
      <Band background={background}>
        <FaqSection items={faqs.slice(0, 3)} />
      </Band>
      <Band background={background}>
        <CtaBanner {...cta} layout="split" />
      </Band>
    </>
  );
}

const meta = {
  title: 'Compositions/SectionBackgrounds',
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultPartOne: Story = { render: () => <PartOne background="default" /> };
export const DefaultPartTwo: Story = { render: () => <PartTwo background="default" /> };
export const SubtlePartOne: Story = { render: () => <PartOne background="subtle" /> };
export const SubtlePartTwo: Story = { render: () => <PartTwo background="subtle" /> };
export const AccentPartOne: Story = { render: () => <PartOne background="accent" /> };
export const AccentPartTwo: Story = { render: () => <PartTwo background="accent" /> };
export const InversePartOne: Story = { render: () => <PartOne background="inverse" /> };
export const InversePartTwo: Story = { render: () => <PartTwo background="inverse" /> };
