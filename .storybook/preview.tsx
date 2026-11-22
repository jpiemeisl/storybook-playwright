import type { Decorator, Preview } from '@storybook/react-vite';
import { useEffect, type ReactNode } from 'react';
import { Theme, themes, type ThemeName } from '../src/components/Theme';
import '../src/tokens/index.css';

/** Mirrors the theme onto <html> (docs pages, canvas background, native controls and scrollbars). */
function ThemeRoot({ theme, children }: { theme: ThemeName; children: ReactNode }) {
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);
  return <Theme name={theme}>{children}</Theme>;
}

/** Wraps every story in <Theme> from the toolbar's `theme` global (URL: &globals=theme:harbor). */
const withTheme: Decorator = (Story, context) => {
  const theme = (themes.some((t) => t.name === context.globals.theme) ? context.globals.theme : 'default') as ThemeName;
  return (
    <ThemeRoot theme={theme}>
      <Story />
    </ThemeRoot>
  );
};

const preview: Preview = {
  tags: ['autodocs'],
  globalTypes: {
    theme: {
      description: 'Theme (data-theme on the story and <html>)',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: themes.map((t) => ({ value: t.name, title: t.label })),
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { theme: 'default' },
  parameters: {
    layout: 'padded',
    // Themes own the background; the backgrounds tool would fight them.
    backgrounds: { disable: true },
    controls: {
      matchers: {
        color: /(background|color)$/i,
      },
    },
    a11y: {
      test: 'error',
    },
  },
  decorators: [withTheme],
};

export default preview;
