import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';
import { Text } from '../Text';
import { SkipLink } from './SkipLink';

const meta = {
  title: 'Navigation/SkipLink',
  component: SkipLink,
  parameters: { layout: 'fullscreen' },
  render: (args) => (
    <>
      <SkipLink {...args} />
      <main id="main" tabIndex={-1} style={{ padding: 'var(--gap-md)' }}>
        <Text>Press Tab to reveal the skip link, then Enter to jump here.</Text>
      </main>
    </>
  ),
} satisfies Meta<typeof SkipLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Unfocused: present in the DOM and accessibility tree, but not visible. */
export const Default: Story = {};

/** First Tab press focuses the skip link, which appears at the top of the viewport. */
export const Focused: Story = {
  play: async ({ canvasElement }) => {
    await userEvent.tab();
    const link = within(canvasElement).getByRole('link', { name: 'Skip to main content' });
    await expect(link).toHaveFocus();
  },
};
