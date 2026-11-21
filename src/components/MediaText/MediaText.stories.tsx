import type { Meta, StoryObj } from '@storybook/react-vite';
import { fixtureImages } from '../../fixtures/images';
import { mediaText } from '../../fixtures/sections';
import { inSection } from '../../stories/inSection';
import { Image } from '../Image';
import { MediaText } from './MediaText';

const meta = {
  title: 'Sections/MediaText',
  component: MediaText,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: {
    ...mediaText,
    media: <Image {...fixtureImages.heroDesk} aspectRatio="4 / 3" />,
    mediaPosition: 'start',
    mediaWidth: 'balanced',
  },
} satisfies Meta<typeof MediaText>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MediaStart: Story = {};

export const MediaEnd: Story = {
  args: { mediaPosition: 'end' },
};

export const WideMedia: Story = {
  args: { mediaWidth: 'wide', media: <Image {...fixtureImages.heroOffice} aspectRatio="16 / 9" /> },
};

export const TextOnly: Story = {
  args: { actions: [], eyebrow: undefined },
};

export const RichBody: Story = {
  args: {
    body: (
      <>
        <p>Link your bank and card accounts in about ten minutes.</p>
        <ul style={{ margin: 0, paddingInlineStart: '1.25rem' }}>
          <li>Transactions categorised every week</li>
          <li>Missing receipts chased for you</li>
          <li>A one-page summary on the 10th of each month</li>
        </ul>
      </>
    ),
  },
};

export const OnInverseSection: Story = {
  parameters: { surface: 'inverse' },
};
