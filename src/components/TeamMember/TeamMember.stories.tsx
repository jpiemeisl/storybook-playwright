import type { Meta, StoryObj } from '@storybook/react-vite';
import { teamEight, teamOne, teamThree } from '../../fixtures/content';
import { inSection } from '../../stories/inSection';
import { TeamGrid, TeamMember } from './TeamMember';

const meta = {
  title: 'Data/TeamGrid',
  component: TeamGrid,
  tags: ['vrt-full'],
  decorators: [inSection],
  parameters: { layout: 'fullscreen' },
  args: { members: teamEight, columns: 4 },
} satisfies Meta<typeof TeamGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Eight members: long name and bio, a missing photo (initials), equal-height cards. */
export const EightMembers: Story = {};

export const ThreeMembers: Story = {
  args: { members: teamThree, columns: 3 },
};

export const OneMember: Story = {
  args: { members: teamOne, columns: 3 },
};

export const Minimal: Story = {
  args: { variant: 'minimal', columns: 2 },
};

export const SingleCardLongBio: Story = {
  render: () => (
    <div style={{ maxInlineSize: '22rem' }}>
      <TeamMember {...teamEight[6]!} />
    </div>
  ),
};
