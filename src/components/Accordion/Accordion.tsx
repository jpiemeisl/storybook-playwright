import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import type { FaqItem } from '../../component-types/sections';
import { Heading } from '../Heading';
import { Icon } from '../Icon';
import { Text } from '../Text';
import styles from './Accordion.module.css';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Let several panels be open at once. Default false (opening one closes the others). */
  allowMultiple?: boolean;
  /** Ids open on first render. */
  defaultExpanded?: string[];
  /** Level of the heading that wraps each trigger button. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

/**
 * WAI-ARIA accordion: each header is a real button (aria-expanded, aria-controls) inside a heading,
 * each panel a labelled region. Enter/Space toggle; ArrowUp/ArrowDown/Home/End move between headers.
 * Closed panels are hidden from assistive tech and the tab order (visibility: hidden).
 */
export function Accordion({ items, allowMultiple = false, defaultExpanded = [], headingLevel = 3 }: AccordionProps) {
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [expanded, setExpanded] = useState<string[]>(() =>
    allowMultiple ? defaultExpanded : defaultExpanded.slice(0, 1),
  );

  const toggle = (id: string) =>
    setExpanded((open) =>
      open.includes(id) ? open.filter((openId) => openId !== id) : allowMultiple ? [...open, id] : [id],
    );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const triggers = Array.from(rootRef.current?.querySelectorAll<HTMLButtonElement>('[data-accordion-trigger]') ?? []);
    const index = triggers.indexOf(event.currentTarget);
    const last = triggers.length - 1;
    const targets: Record<string, number> = {
      ArrowDown: index === last ? 0 : index + 1,
      ArrowUp: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    triggers[next]?.focus();
  };

  return (
    <div ref={rootRef} className={styles.accordion}>
      {items.map((item) => {
        const open = expanded.includes(item.id);
        const buttonId = `${baseId}-${item.id}-button`;
        const panelId = `${baseId}-${item.id}-panel`;
        return (
          <div key={item.id} className={styles.item}>
            <Heading as={`h${headingLevel}` as const} size="md" className={styles.heading}>
              <button
                id={buttonId}
                type="button"
                data-accordion-trigger=""
                aria-expanded={open}
                aria-controls={panelId}
                className={styles.trigger}
                onClick={() => toggle(item.id)}
                onKeyDown={onKeyDown}
              >
                <span>{item.title}</span>
                <Icon name="chevron-down" className={styles.chevron} />
              </button>
            </Heading>
            <div id={panelId} role="region" aria-labelledby={buttonId} className={styles.panel} data-open={open}>
              <div className={styles.panelInner}>
                <div className={styles.panelContent}>{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export interface FaqSectionProps {
  items: FaqItem[];
  heading?: string;
  intro?: ReactNode;
  allowMultiple?: boolean;
  /** Level of `heading`; questions use the next level down. Default 2. */
  headingLevel?: 2 | 3;
}

/** Heading + Accordion of questions. No structured-data markup. Content block: place inside Section + Container. */
export function FaqSection({
  items,
  heading = 'Frequently asked questions',
  intro,
  allowMultiple = false,
  headingLevel = 2,
}: FaqSectionProps) {
  return (
    <div className={styles.faq}>
      <div className={styles.faqHeader}>
        <Heading as={`h${headingLevel}` as const} size="2xl">
          {heading}
        </Heading>
        {intro && (
          <Text as="div" tone="muted">
            {intro}
          </Text>
        )}
      </div>
      <Accordion
        items={items.map(({ id, question, answer }) => ({ id, title: question, content: answer }))}
        allowMultiple={allowMultiple}
        headingLevel={(headingLevel + 1) as 3 | 4}
      />
    </div>
  );
}
