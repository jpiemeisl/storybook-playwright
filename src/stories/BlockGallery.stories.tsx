import type { Meta, StoryObj } from '@storybook/react-vite';
import type { SectionBackground } from '../components/Section';
import { blockTypes } from '../content-types/blocks';
import { BlockRenderer } from '../registry';
import { fixtureBlocks } from './contentModel';

/*
 * Every block type (from src/fixtures/blocks) rendered by BlockRenderer on one background, to check
 * section spacing, padding defaults and contrast per surface. Split in two halves per background so
 * full-page screenshots stay a manageable height. The a11y gate runs on each story.
 */
const half = Math.ceil(blockTypes.length / 2);
const parts = { 1: blockTypes.slice(0, half), 2: blockTypes.slice(half) } as const;

const meta = {
  title: 'Content model/Block gallery',
  parameters: { layout: 'fullscreen', vrt: { viewports: [{ width: 1280, height: 800, fullPage: true }] } },
  args: { background: 'default', part: 1 },
  argTypes: {
    background: { control: 'inline-radio', options: ['default', 'subtle', 'accent', 'inverse'] },
    part: { control: 'inline-radio', options: [1, 2] },
  },
  render: ({ background, part }) => (
    <main>
      <BlockRenderer blocks={fixtureBlocks(parts[part]).map((block) => ({ ...block, background }))} />
    </main>
  ),
} satisfies Meta<{ background: SectionBackground; part: 1 | 2 }>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DefaultPartOne: Story = { args: { background: 'default', part: 1 } };
export const DefaultPartTwo: Story = { args: { background: 'default', part: 2 } };
export const SubtlePartOne: Story = { args: { background: 'subtle', part: 1 } };
export const SubtlePartTwo: Story = { args: { background: 'subtle', part: 2 } };
export const AccentPartOne: Story = { args: { background: 'accent', part: 1 } };
export const AccentPartTwo: Story = { args: { background: 'accent', part: 2 } };
export const InversePartOne: Story = { args: { background: 'inverse', part: 1 } };
export const InversePartTwo: Story = { args: { background: 'inverse', part: 2 } };
