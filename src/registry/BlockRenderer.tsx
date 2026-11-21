import { Component, useEffect, useMemo, useRef, type ErrorInfo, type ReactNode } from 'react';
import type { Block, NestedBlock } from '../content-types/blocks';
import { Container } from '../components/Container';
import { Section, type SectionBackground, type SectionPadding } from '../components/Section';
import { assignHeadingLevels } from './headingLevels';
import { isSafeAnchorId } from './links';
import { defaultRegistry, type Registry } from './registry';
import type { BlockContext, BlockLike, RendererContext } from './types';
import { isFatal, validateBlock, type ValidationIssue } from './validate';
import styles from './BlockRenderer.module.css';

export interface BlockRendererProps {
  /** Blocks in display order (usually PageContent.blocks). Custom block types are allowed. */
  blocks: readonly (Block | BlockLike)[];
  /** Defaults to the built-in registry. Use createRegistry() to add or replace block types. */
  registry?: Registry;
  /** Handlers blocks may use (e.g. form submission). */
  context?: RendererContext;
  /** Called once per problem: unknown types, invalid content, refused links, render errors. */
  onError?: (issue: ValidationIssue) => void;
  /** Show visible placeholders for blocks that could not render (CMS previews). Default false. */
  showErrors?: boolean;
  /**
   * The page already has its h1 (a template rendered the title), so blocks start at h2: a hero or
   * pageHeader then renders an h2 too. Default false.
   */
  h1Provided?: boolean;
  /**
   * `page` (default): each block in its own Section (background, padding, anchorId) and Container.
   * `flow`: blocks stacked with even spacing and no Section or Container, for a column inside a
   * template (e.g. an article body). Backgrounds and padding are ignored; anchorIds still apply.
   */
  layout?: 'page' | 'flow';
}

/**
 * Renders a page of blocks. Each block gets its Section (background, padding, anchorId) and the
 * Container its component expects; heading levels are assigned centrally; invalid or unknown blocks
 * are skipped (or shown as placeholders with `showErrors`) and reported through `onError`.
 */
export function BlockRenderer({
  blocks,
  registry = defaultRegistry,
  context,
  onError,
  showErrors = false,
  h1Provided = false,
  layout = 'page',
}: BlockRendererProps) {
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;
  const { nodes, issues } = useMemo(
    () =>
      renderBlocks(blocks, {
        registry,
        context: context ?? {},
        showErrors,
        h1Provided,
        layout,
        // Errors caught by a block's error boundary arrive after render (commit phase).
        onLateIssue: (issue) => onErrorRef.current?.(issue),
      }),
    [blocks, registry, context, showErrors, h1Provided, layout],
  );

  // Report mapping/validation issues from an effect, not during render, so rendering stays pure.
  useEffect(() => {
    issues.forEach((issue) => onErrorRef.current?.(issue));
  }, [issues]);

  return layout === 'flow' ? <div className={styles.flow}>{nodes}</div> : <>{nodes}</>;
}

interface RenderOptions {
  registry: Registry;
  context: RendererContext;
  showErrors: boolean;
  h1Provided?: boolean;
  layout?: 'page' | 'flow';
  onLateIssue?: (issue: ValidationIssue) => void;
}

/** Maps and renders a list of blocks. Exported for templates that need the nodes directly. */
export function renderBlocks(
  blocks: readonly BlockLike[],
  options: RenderOptions,
  nested = false,
): { nodes: ReactNode[]; issues: ValidationIssue[] } {
  const { registry, showErrors } = options;
  const issues: ValidationIssue[] = [];
  const knownTypes = registry.types();
  const levels = nested ? blocks.map(() => 3 as const) : assignHeadingLevels(blocks, registry.get, { h1Provided: options.h1Provided });
  // Element ids must be unique: the first block with a given anchorId keeps it.
  const usedAnchors = new Set<string>();

  const nodes = blocks.map((block, index) => {
    const key = typeof block?.id === 'string' && block.id ? `${block.id}-${index}` : `block-${index}`;
    const meta = { blockId: block?.id, blockType: block?.type };
    const blockIssues = validateBlock(block, { knownTypes });
    issues.push(...blockIssues);

    const fatal = blockIssues.find(isFatal);
    const definition = registry.get(block?.type);
    if (fatal || !definition) {
      return showErrors ? <Placeholder key={key} issue={fatal ?? blockIssues[0]} block={block} /> : null;
    }

    const headingLevel = levels[index]!;
    const ctx: BlockContext = {
      ...options.context,
      headingLevel,
      itemHeadingLevel: (headingLevel + 1) as 2 | 3 | 4,
      report: (issue) => issues.push({ severity: 'error', ...meta, ...issue }),
      renderNested: (nestedBlocks: NestedBlock[]) => {
        const result = renderBlocks(nestedBlocks, options, true);
        issues.push(...result.issues);
        return <div className={styles.nested}>{result.nodes}</div>;
      },
    };

    let content: ReactNode | null;
    try {
      content = definition.render(block, ctx);
    } catch (error) {
      const issue = renderError(block, error);
      issues.push(issue);
      return showErrors ? <Placeholder key={key} issue={issue} block={block} /> : null;
    }
    if (content === null) {
      const issue: ValidationIssue = { code: 'render-error', severity: 'error', message: 'This block could not be rendered from its content.', path: '', ...meta };
      issues.push(issue);
      return showErrors ? <Placeholder key={key} issue={issue} block={block} /> : null;
    }

    const boundary = (
      <BlockErrorBoundary block={block} showErrors={showErrors} onIssue={(issue) => options.onLateIssue?.(issue)}>
        {content}
      </BlockErrorBoundary>
    );

    if (nested) return <div key={key}>{boundary}</div>;

    let anchorId = isSafeAnchorId(block.anchorId) ? block.anchorId : undefined;
    if (anchorId && usedAnchors.has(anchorId)) {
      issues.push({ code: 'duplicate-id', severity: 'error', message: `anchorId "${anchorId}" is already used on this page; it was left off this block.`, path: 'anchorId', ...meta });
      anchorId = undefined;
    }
    if (anchorId) usedAnchors.add(anchorId);

    if (options.layout === 'flow') {
      return (
        <div key={key} id={anchorId} data-block-type={block.type}>
          {boundary}
        </div>
      );
    }

    const layout = definition.layout(block);
    const padding = block.padding ?? definition.defaultPadding(block);
    const background = block.background ?? 'default';
    return (
      <PageSection key={key} id={anchorId} background={background} padding={padding} data-block-type={block.type}>
        {layout === 'full-bleed' ? boundary : <Container size={layout === 'narrow' ? 'md' : 'xl'}>{boundary}</Container>}
      </PageSection>
    );
  });

  return { nodes, issues };
}

export interface PageSectionProps {
  background?: SectionBackground;
  padding?: SectionPadding;
  id?: string;
  children: ReactNode;
  'data-block-type'?: string;
  /** Accessible name; makes the section a region landmark. Use sparingly. */
  'aria-label'?: string;
}

/**
 * A full-width band of a page: Section plus the spacing rule BlockRenderer uses, so two adjacent
 * PageSections with the same background do not double their padding. Templates use it for their
 * structured parts, so those sit next to rendered blocks with the same rhythm. Sections with
 * padding "none" never collapse the next one.
 */
export function PageSection({ background = 'default', padding = 'md', children, ...rest }: PageSectionProps) {
  return (
    // A section without padding (full-bleed background hero, spacer) must not cancel the next section's top padding.
    <Section background={background} padding={padding} data-background={padding === 'none' ? undefined : background} className={styles.block} {...rest}>
      {children}
    </Section>
  );
}

function renderError(block: BlockLike, error: unknown): ValidationIssue {
  return {
    code: 'render-error',
    severity: 'error',
    message: `Rendering failed: ${error instanceof Error ? error.message : String(error)}`,
    path: '',
    blockId: block?.id,
    blockType: block?.type,
  };
}

/** Catches errors thrown while a block's component renders, so one bad block cannot take down the page. */
class BlockErrorBoundary extends Component<
  { block: BlockLike; showErrors: boolean; onIssue: (issue: ValidationIssue) => void; children: ReactNode },
  { issue: ValidationIssue | null }
> {
  state = { issue: null as ValidationIssue | null };

  static getDerivedStateFromError() {
    return { issue: { code: 'render-error', severity: 'error', message: 'Rendering failed.', path: '' } as ValidationIssue };
  }

  componentDidCatch(error: unknown, _info: ErrorInfo) {
    const issue = renderError(this.props.block, error);
    this.setState({ issue });
    this.props.onIssue(issue);
    console.error(`[BlockRenderer] block "${this.props.block?.id}" (${this.props.block?.type}) failed to render`, error);
  }

  render() {
    if (this.state.issue) return this.props.showErrors ? <Placeholder issue={this.state.issue} block={this.props.block} /> : null;
    return this.props.children;
  }
}

/** Visible, clearly styled stand-in for a block that could not render (only with showErrors). */
function Placeholder({ issue, block }: { issue?: ValidationIssue; block: BlockLike }) {
  const unknown = issue?.code === 'unknown-type';
  return (
    <div className={styles.placeholderSection}>
      <Container size="xl">
        <div className={styles.placeholder} role="note">
          <p className={styles.placeholderTitle}>{unknown ? `Unknown block: ${block?.type}` : `Block could not be rendered: ${block?.type ?? 'unknown'}`}</p>
          <p className={styles.placeholderBody}>
            {issue ? `${issue.message}${issue.path ? ` (at ${issue.path})` : ''}` : 'No details.'}
          </p>
          <p className={styles.placeholderMeta}>Block id: {block?.id || '(missing)'}. Only visible in previews (showErrors).</p>
        </div>
      </Container>
    </div>
  );
}
