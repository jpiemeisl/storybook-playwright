import { defineConfig } from 'vitest/config';

// Unit tests for pure logic only (validators, link safety, adapters, registry). Components are
// covered by Storybook interaction tests and the Playwright visual suite.
export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
