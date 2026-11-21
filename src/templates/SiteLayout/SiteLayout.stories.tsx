import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, within } from 'storybook/test';
import { Container } from '../../components/Container';
import { Heading } from '../../components/Heading';
import { Section } from '../../components/Section';
import { Text } from '../../components/Text';
import { chromes } from '../../stories/templatePages';
import { SiteLayout } from './SiteLayout';

const meta = {
  title: 'Templates/SiteLayout',
  component: SiteLayout,
  tags: ['vrt-mobile'],
  parameters: { layout: 'fullscreen' },
  args: {
    chrome: chromes.default,
    currentPath: '/pricing',
    onError: fn(),
    children: (
      <Section>
        <Container size="xl">
          <Heading as="h1" size="3xl">
            Page content
          </Heading>
          <Text tone="muted">Everything a template renders goes inside the single main landmark.</Text>
        </Container>
      </Section>
    ),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole('main')).toHaveLength(1);
    await expect(canvas.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#main');
    await expect(args.onError).not.toHaveBeenCalled();
  },
} satisfies Meta<typeof SiteLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Announcement, full header (Pricing marked current) and footer. */
export const Default: Story = {
  play: async (context) => {
    await meta.play(context);
    const canvas = within(context.canvasElement);
    await expect(canvas.getAllByRole('banner')).toHaveLength(1);
    await expect(canvas.getAllByRole('contentinfo')).toHaveLength(1);
    // The inline nav is hidden below 48rem, so query the DOM (the closed mobile menu repeats the link).
    await expect(new Set([...context.canvasElement.querySelectorAll('header a[aria-current="page"]')].map((a) => a.textContent))).toEqual(new Set(['Pricing']));
  },
};

/** Logo-only header and legal-only footer (landing pages, checkout). */
export const Minimal: Story = { args: { variant: 'minimal' } };

/** No header or footer (embeds, previews). Still one main landmark and the skip link. */
export const Bare: Story = {
  args: { variant: 'bare' },
  play: async (context) => {
    await meta.play(context);
    await expect(within(context.canvasElement).queryByRole('banner')).toBeNull();
  },
};

/** The minimal chrome fixture (logo and legal line only) in the default variant. */
export const MinimalChromeData: Story = { args: { chrome: chromes.minimal } };
