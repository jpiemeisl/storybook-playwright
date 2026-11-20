import type { Meta, StoryObj } from '@storybook/react-vite';
import { Grid } from '../Grid';
import { Stack } from '../Stack';
import { Text } from '../Text';
import { Heading } from '../Heading';
import { Icon, iconNames, socialIconNames, type IconName } from './Icon';

const meta = {
  title: 'Primitives/Icon',
  component: Icon,
  args: { name: 'arrow-right', size: 'md' },
  argTypes: {
    name: { control: 'select', options: iconNames },
    size: { control: 'inline-radio', options: ['sm', 'md', 'lg', 'xl'] },
  },
} satisfies Meta<typeof Icon>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  tags: ['skip-vrt'],
};

const socialSet = new Set<IconName>(socialIconNames);
const groups = [
  { title: 'Interface', names: iconNames.filter((name) => !socialSet.has(name)) },
  { title: 'Social', names: [...socialIconNames] },
];

/** Every icon in the set, grouped. Decorative here: names are shown as visible text. */
export const AllIcons: Story = {
  render: (args) => (
    <Stack gap="xl">
      {groups.map((group) => (
        <Stack key={group.title} gap="md">
          <Heading size="md">{group.title}</Heading>
          <Grid as="ul" columns={{ base: 2, sm: 3, md: 5, lg: 6 }} gap="lg">
            {group.names.map((name) => (
              <Stack as="li" key={name} align="center" gap="sm">
                <Icon {...args} name={name} size="lg" />
                <Text as="span" size="xs" tone="muted">
                  {name}
                </Text>
              </Stack>
            ))}
          </Grid>
        </Stack>
      ))}
    </Stack>
  ),
};

export const Sizes: Story = {
  render: (args) => (
    <Stack direction="row" gap="lg" align="center">
      <Icon {...args} size="sm" />
      <Icon {...args} size="md" />
      <Icon {...args} size="lg" />
      <Icon {...args} size="xl" />
    </Stack>
  ),
};

/** Icons use currentColor, so they follow the surrounding text colour. */
export const InheritsColor: Story = {
  render: (args) => (
    <Stack direction="row" gap="lg" align="center">
      <Text as="span" tone="default">
        <Icon {...args} name="check" />
      </Text>
      <Text as="span" tone="success">
        <Icon {...args} name="check" />
      </Text>
      <Text as="span" tone="danger">
        <Icon {...args} name="close" />
      </Text>
    </Stack>
  ),
};

/** A titled icon has role="img" and an accessible name; use when there is no visible label. */
export const Meaningful: Story = {
  args: { name: 'search', title: 'Search', size: 'lg' },
};
