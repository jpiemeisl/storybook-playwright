import { createElement, type ComponentType, type ReactNode } from 'react';
import type { NestedBlock } from '../content-types/blocks';
import type { ContactFormValues } from '../components/ContactForm';
import type { FormStatus } from '../components/forms';
import type { NewsletterValues } from '../components/NewsletterSignup';
import type { ValidationIssue } from './validate';

/** Optional handlers that make form blocks interactive. Without them, forms render as inert previews. */
export interface FormHandlers {
  contact?: {
    onSubmit: (values: ContactFormValues) => void;
    status?: FormStatus;
    errorMessage?: string;
    successMessage?: string;
    onReset?: () => void;
  };
  newsletter?: {
    onSubmit: (values: NewsletterValues) => void;
    status?: FormStatus;
    errorMessage?: string;
    successMessage?: string;
  };
}

/** What the host app can pass to BlockRenderer for blocks to use. */
export interface RendererContext {
  forms?: FormHandlers;
}

/** Passed to every toProps call. */
export interface BlockContext extends RendererContext {
  /** Level for the block's own top-level heading, assigned centrally by the renderer. */
  headingLevel: 1 | 2 | 3;
  /** Level for headings of items inside the block (always headingLevel + 1). */
  itemHeadingLevel: 2 | 3 | 4;
  /** Report a problem found while mapping (e.g. an unsafe link that was neutralised). */
  report: (issue: Pick<ValidationIssue, 'code' | 'message' | 'path'> & Partial<ValidationIssue>) => void;
  /** Renders nested blocks (used by tabs). One level only. */
  renderNested: (blocks: NestedBlock[]) => ReactNode;
}

/** Minimum shape of any block content, built-in or custom. */
export interface BlockLike {
  id: string;
  type: string;
  anchorId?: string;
  background?: 'default' | 'subtle' | 'accent' | 'inverse';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

/** How the renderer wraps a block: `contained` in Container xl, `narrow` in Container md, `full-bleed` with no Container. */
export type BlockLayout = 'contained' | 'narrow' | 'full-bleed';

/** A typed block definition: content type T, component props P. */
export interface BlockDefinition<T extends BlockLike, P extends object> {
  type: T['type'];
  /** Human name for editors and docs. */
  label: string;
  /** One-line description for editors and docs. */
  description: string;
  /** Key of an example in src/fixtures/blocks. */
  example?: string;
  component: ComponentType<P>;
  /** Converts content into component props. Return null when the block cannot render (report why). */
  toProps: (content: T, ctx: BlockContext) => P | null;
  /** Whether this block renders a top-level heading (drives heading levels). Default: Boolean(content.heading). */
  hasHeading?: (content: T) => boolean;
  /** May receive the page's h1 (hero, pageHeader). */
  pageHeading?: boolean;
  /** How the renderer wraps it: Container xl (default), Container md, or no Container. */
  layout?: BlockLayout | ((content: T) => BlockLayout);
  /** Section padding when the block does not set one. Default "md". */
  defaultPadding?: BlockLike['padding'] | ((content: T) => NonNullable<BlockLike['padding']>);
}

/** A definition with its types erased, as stored in a registry. */
export interface RegisteredBlock {
  type: string;
  label: string;
  description: string;
  example?: string;
  pageHeading: boolean;
  hasHeading: (content: BlockLike) => boolean;
  layout: (content: BlockLike) => BlockLayout;
  defaultPadding: (content: BlockLike) => NonNullable<BlockLike['padding']>;
  /** Maps and renders. Returns null when toProps refused. */
  render: (content: BlockLike, ctx: BlockContext) => ReactNode | null;
}

/**
 * Declares a block type. Fully typed at the call site (content T, props P); stored type-erased so a
 * registry can hold definitions with different prop types.
 */
export function defineBlock<T extends BlockLike, P extends object>(definition: BlockDefinition<T, P>): RegisteredBlock {
  const { layout = 'contained', defaultPadding = 'md' } = definition;
  return {
    type: definition.type,
    label: definition.label,
    description: definition.description,
    example: definition.example,
    pageHeading: definition.pageHeading ?? false,
    hasHeading: (content) =>
      definition.hasHeading ? definition.hasHeading(content as T) : Boolean((content as { heading?: unknown }).heading),
    layout: (content) => (typeof layout === 'function' ? layout(content as T) : layout),
    defaultPadding: (content) => (typeof defaultPadding === 'function' ? defaultPadding(content as T) : defaultPadding),
    render: (content, ctx) => {
      const props = definition.toProps(content as T, ctx);
      return props === null ? null : createElement(definition.component, props);
    },
  };
}
