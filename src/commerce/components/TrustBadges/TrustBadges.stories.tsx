import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';
import { cartView } from '../../stories/cartStories';
import layout from '../../stories/storyLayout.module.css';
import { TrustBadges } from './TrustBadges';

const meta = { title: 'Commerce/Checkout/TrustBadges', component: TrustBadges } satisfies Meta<typeof TrustBadges>;
export default meta;
type Story = StoryObj<Record<string, never>>;

const kinds = [
  ['Physical', 'physicalOnly'],
  ['Digital', 'digitalOnly'],
  ['Subscription', 'subscriptionOnly'],
  ['Mixed', 'mixed'],
] as const;

/** Items per cart kind: only what applies. */
export const PerCartKind: Story = {
  render: () => (
    <div style={{ display: 'grid', gap: '1rem' }}>
      {kinds.map(([label, key]) => (
        <div key={key} data-testid={key}>
          <p className={layout.label}>{label}</p>
          <TrustBadges flags={cartView(key).totals.flags} />
        </div>
      ))}
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(within(canvas.getByTestId('digitalOnly')).queryByText('Easy 30-day returns')).toBeNull();
    await expect(within(canvas.getByTestId('digitalOnly')).getByText('Instant digital delivery')).toBeVisible();
    await expect(within(canvas.getByTestId('mixed')).getAllByRole('listitem')).toHaveLength(4);
  },
};
