import type { Preview } from '@storybook/react-vite';
import '../src/tokens/index.css';

const preview: Preview = {
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    controls: {
      matchers: {
        color: /(background|color)$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
  decorators: [
    (Story) => (
      <div data-theme="default">
        <Story />
      </div>
    ),
  ],
};

export default preview;
