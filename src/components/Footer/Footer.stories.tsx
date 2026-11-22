import type { Meta, StoryObj } from '@storybook/react-vite';
import { footerColumns, footerColumnsThree, socialLinks } from '../../fixtures/navigation';
import { LegalContent } from '../../stories/FooterContent';
import { Logo } from '../../stories/Logo';
import { NewsletterForm } from '../../stories/NewsletterForm';
import { Footer } from './Footer';

const meta = {
  title: 'Navigation/Footer',
  component: Footer,
  tags: ['vrt-full'],
  parameters: { layout: 'fullscreen' },
  args: {
    logo: <Logo />,
    columns: footerColumns,
    social: socialLinks,
    legal: <LegalContent />,
  },
} satisfies Meta<typeof Footer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 1 column on narrow slots, 2 on medium, 4 on wide. */
export const FourColumns: Story = { tags: ['theme-smoke'] };

export const ThreeColumns: Story = {
  args: { columns: footerColumnsThree },
};

export const WithNewsletter: Story = {
  args: { newsletter: <NewsletterForm /> },
};

/** Only the legal slot: everything else is optional. */
export const Minimal: Story = {
  args: { logo: undefined, columns: undefined, social: undefined },
};
