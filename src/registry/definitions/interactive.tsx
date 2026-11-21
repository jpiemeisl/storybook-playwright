/*
 * Form blocks. Interactive only when the host app supplies handlers via BlockRenderer `context`;
 * otherwise they render as inert previews so pages still look right in a CMS preview.
 */
import type { ReactNode } from 'react';
import type { ContactFormBlock, NewsletterSignupBlock } from '../../content-types/blocks';
import { ContactForm, type ContactFormProps } from '../../components/ContactForm';
import { NewsletterSignup, type NewsletterSignupProps } from '../../components/NewsletterSignup';
import { Text } from '../../components/Text';
import { HeadedBlock } from '../helpers';
import { defineBlock } from '../types';
import styles from '../BlockRenderer.module.css';

/** Makes a form non-interactive (inert) with a visible note, when no handler is connected. */
function Preview({ connected, children }: { connected: boolean; children: ReactNode }) {
  if (connected) return <>{children}</>;
  return (
    <div className={styles.formPreview}>
      <Text size="sm" tone="muted" className={styles.previewNote}>
        Form preview: not connected to a submit handler.
      </Text>
      <div inert>{children}</div>
    </div>
  );
}

function ContactView({ heading, intro, level, connected, form }: { heading?: string; intro?: string; level: 1 | 2 | 3; connected: boolean; form: ContactFormProps }) {
  return (
    <HeadedBlock heading={heading} intro={intro} level={level}>
      <Preview connected={connected}>
        <ContactForm {...form} />
      </Preview>
    </HeadedBlock>
  );
}

export const contactForm = defineBlock({
  type: 'contactForm',
  label: 'Contact form',
  description: 'Name, email, phone, subject, message and optional consent.',
  example: 'contactForm',
  component: ContactView,
  layout: 'narrow',
  toProps: (c: ContactFormBlock, ctx) => {
    const handler = ctx.forms?.contact;
    return {
      heading: c.heading,
      intro: c.intro,
      level: ctx.headingLevel,
      connected: Boolean(handler),
      form: {
        subjectOptions: c.subjectOptions,
        consentLabel: c.consentLabel,
        onSubmit: handler?.onSubmit ?? (() => {}),
        status: handler?.status,
        errorMessage: handler?.errorMessage,
        successMessage: handler?.successMessage,
        onReset: handler?.onReset,
      },
    };
  },
});

function NewsletterView({ heading, description, level, connected, form }: { heading?: string; description?: string; level: 1 | 2 | 3; connected: boolean; form: NewsletterSignupProps }) {
  return (
    <HeadedBlock heading={heading} intro={description} level={level}>
      <Preview connected={connected}>
        <NewsletterSignup {...form} />
      </Preview>
    </HeadedBlock>
  );
}

export const newsletterSignup = defineBlock({
  type: 'newsletterSignup',
  label: 'Newsletter sign-up',
  description: 'Email sign-up with optional name and consent.',
  example: 'newsletterSignup',
  component: NewsletterView,
  layout: 'narrow',
  toProps: (c: NewsletterSignupBlock, ctx) => {
    const handler = ctx.forms?.newsletter;
    return {
      heading: c.heading,
      description: c.description,
      level: ctx.headingLevel,
      connected: Boolean(handler),
      form: {
        layout: c.layout,
        showName: c.showName,
        consentLabel: c.consentLabel,
        submitLabel: c.submitLabel,
        onSubmit: handler?.onSubmit ?? (() => {}),
        status: handler?.status,
        errorMessage: handler?.errorMessage,
        successMessage: handler?.successMessage,
      },
    };
  },
});
