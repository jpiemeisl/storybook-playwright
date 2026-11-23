import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  // demo/ holds the Storybook-only demo cart provider and its playground stories.
  // Introduction.mdx first, so it opens first in the sidebar.
  stories: ['../src/stories/Introduction.mdx', '../src/**/*.stories.@(ts|tsx)', '../demo/**/*.stories.@(ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  // JSON page fixtures reference images by URL (JSON cannot import), served from here.
  staticDirs: [
    { from: '../src/fixtures/images', to: '/fixtures/images' },
    { from: '../src/commerce/fixtures/images', to: '/commerce/images' },
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
};

export default config;
