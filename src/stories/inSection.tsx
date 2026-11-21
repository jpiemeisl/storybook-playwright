import type { Decorator } from '@storybook/react-vite';
import { Container } from '../components/Container';
import { Section, type SectionBackground } from '../components/Section';

/**
 * Story-only decorator: renders a content block the way a page would, inside Section + Container.
 * `parameters.surface` picks the Section background; `parameters.bare` skips the wrapper
 * (for full-bleed blocks such as the background Hero).
 */
export const inSection: Decorator = (Story, { parameters }) => {
  if (parameters.bare) return <Story />;
  const background = (parameters.surface as SectionBackground | undefined) ?? 'default';
  return (
    <Section background={background} padding="md">
      <Container size="xl">
        <Story />
      </Container>
    </Section>
  );
};

/** Story-only decorator: a realistic form-column width for single controls. */
export const narrow: Decorator = (Story) => (
  <div style={{ maxInlineSize: '24rem' }}>
    <Story />
  </div>
);
