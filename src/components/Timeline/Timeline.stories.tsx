import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { stepsSeven, stepsThree, timelineFour, timelineTwelve } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { Steps, Timeline } from './Timeline';

const meta = {
  title: 'Data/Timeline',
  component: Timeline,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { items: timelineFour },
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FourEvents: Story = {};

/** Twelve events with a long title and some missing descriptions. */
export const TwelveEvents: Story = {
  args: { items: timelineTwelve },
};

export const StepsThree: Story = {
  render: () => <Steps items={stepsThree} />,
};

export const StepsSeven: Story = {
  render: () => <Steps items={stepsSeven} />,
};

/** Progress: earlier steps done (check + "Completed:" text), current step has aria-current="step". */
export const StepsInProgress: Story = {
  render: () => <Steps items={stepsSeven} currentStep={3} />,
  play: async ({ canvasElement }) => {
    const items = within(canvasElement).getAllByRole('listitem');
    await expect(items[2]).toHaveAttribute('aria-current', 'step');
    await expect(items[0]).toHaveTextContent('Completed: Discovery call');
    await expect(items[3]).not.toHaveAttribute('aria-current');
  },
};
