import type { Meta, StoryObj } from '@storybook/react-vite';
import { authors, tagsThree } from '../../fixtures/content';
import { fixtureImages } from '../../fixtures/images';
import { breadcrumbTrails } from '../../fixtures/navigation';
import { inSection } from '../../stories/inSection';
import { AuthorByline } from '../AuthorByline';
import { Breadcrumbs } from '../Breadcrumbs';
import { ButtonLink } from '../Button';
import { Image } from '../Image';
import { TagList } from '../TagList';
import { PageHeader } from './PageHeader';

const meta = {
  title: 'Content/PageHeader',
  component: PageHeader,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: {
    title: 'How to close your books in five working days',
    description: 'A routine for small businesses that turns month-end from a chore into numbers you can act on.',
    breadcrumbs: <Breadcrumbs items={breadcrumbTrails.three} />,
    meta: <AuthorByline author={authors.ana} date="2026-03-14" readingTime="8 min read" />,
  },
} satisfies Meta<typeof PageHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithActions: Story = {
  args: {
    meta: <TagList items={tagsThree} size="sm" />,
    actions: (
      <>
        <ButtonLink href="/consultation">Book a consultation</ButtonLink>
        <ButtonLink href="/guides/close.pdf" variant="secondary">
          Download the checklist
        </ButtonLink>
      </>
    ),
  },
};

export const Centered: Story = {
  args: { variant: 'centered', breadcrumbs: undefined },
};

export const WithMedia: Story = {
  args: { variant: 'with-media', media: <Image {...fixtureImages.heroDesk} aspectRatio="4 / 3" loading="eager" /> },
};

export const TitleOnly: Story = {
  args: { title: 'Pricing', description: undefined, breadcrumbs: undefined, meta: undefined },
};

export const LongTitle: Story = {
  args: {
    title: 'Everything a growing retail business needs to know about sales tax, payroll and inventory before opening a second location',
  },
};

export const OnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};

export const OnAccentSection: Story = {
  args: { variant: 'centered' },
  parameters: { surface: 'accent' },
};
