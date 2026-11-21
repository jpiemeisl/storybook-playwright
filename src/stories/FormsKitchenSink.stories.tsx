import type { Meta, StoryObj } from '@storybook/react-vite';
import { Alert } from '../components/Alert';
import { Button } from '../components/Button';
import { Checkbox } from '../components/Checkbox';
import { Field } from '../components/Field';
import { Grid } from '../components/Grid';
import { Heading } from '../components/Heading';
import { Icon } from '../components/Icon';
import { Input } from '../components/Input';
import { Radio, RadioGroup } from '../components/Radio';
import { SearchInput } from '../components/SearchInput';
import { Select } from '../components/Select';
import { Stack } from '../components/Stack';
import { Textarea } from '../components/Textarea';
import { subjectOptions } from '../fixtures/forms';

/** Every form control in its main states, side by side: the quick review surface for forms. */
function KitchenSink() {
  return (
    <Stack gap="xl">
      <Heading as="h1" size="2xl">
        Form controls
      </Heading>
      <Grid columns={3} gap="lg">
        <Stack gap="md">
          <Heading size="md">Text inputs</Heading>
          <Field label="Default" hint="Help text under the control.">
            <Input placeholder="Placeholder" />
          </Field>
          <Field label="Filled" required>
            <Input type="email" defaultValue="priya@copperleaf.example" startAdornment={<Icon name="mail" size="sm" />} />
          </Field>
          <Field label="Invalid" required error="Enter your full name">
            <Input />
          </Field>
          <Field label="Disabled">
            <Input defaultValue="Can’t change this" disabled />
          </Field>
          <Field label="Read only">
            <Input defaultValue="INV-2026-0412" readOnly />
          </Field>
        </Stack>
        <Stack gap="md">
          <Heading size="md">Select and textarea</Heading>
          <Field label="Subject" required>
            <Select options={subjectOptions} placeholder="Choose a subject" />
          </Field>
          <Field label="Subject (selected)">
            <Select options={subjectOptions} defaultValue="payroll" />
          </Field>
          <Field label="Message" hint="Include any invoice numbers.">
            <Textarea rows={3} showCount maxLength={500} defaultValue="Can you set up payroll for six seasonal staff?" />
          </Field>
          <SearchInput onSearch={() => {}} label="Search help articles" defaultValue="sales tax" />
        </Stack>
        <Stack gap="md">
          <Heading size="md">Choices</Heading>
          <Stack gap="sm">
            <Checkbox label="Unchecked" />
            <Checkbox label="Checked" defaultChecked />
            <Checkbox label="Indeterminate" indeterminate />
            <Checkbox label="With description" description="Secondary text under the label." />
            <Checkbox label="Disabled" disabled />
            <Checkbox label="With error" required error="Tick the box to continue" />
          </Stack>
          <RadioGroup legend="Contact method" defaultValue="email" orientation="horizontal">
            <Radio value="email" label="Email" />
            <Radio value="phone" label="Phone" />
            <Radio value="post" label="Post" disabled />
          </RadioGroup>
          <RadioGroup legend="Plan" variant="card" defaultValue="growth">
            <Radio value="essentials" label="Essentials" description="$49/month" />
            <Radio value="growth" label="Growth" description="$129/month" />
          </RadioGroup>
        </Stack>
      </Grid>
      <Grid columns={2} gap="md">
        <Alert tone="info" title="Info">Informational message.</Alert>
        <Alert tone="success" title="Success">It worked.</Alert>
        <Alert tone="warning" title="Warning">Check this before continuing.</Alert>
        <Alert tone="danger" title="Error">Something went wrong.</Alert>
      </Grid>
      <Stack direction="row" gap="sm" wrap>
        <Button>Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button loading>Loading</Button>
        <Button disabled>Disabled</Button>
        <Button size="sm">Small</Button>
        <Button size="lg">Large</Button>
      </Stack>
    </Stack>
  );
}

const meta = {
  title: 'Compositions/FormsKitchenSink',
  component: KitchenSink,
  tags: ['vrt-full'],
} satisfies Meta<typeof KitchenSink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
