import type { StepItem, TimelineItem } from '../../component-types/content';
import { Icon } from '../Icon';
import styles from './Timeline.module.css';

/** Props for Timeline. */
export interface TimelineProps {
  /** Events in order. Each shows its label (e.g. a date) above its title and optional description. */
  items: TimelineItem[];
  /** Heading level of each item title. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

/** Ordered events. Single column on narrow containers; alternating either side of a centre line from 48rem. */
export function Timeline({ items, headingLevel = 3 }: TimelineProps) {
  const H = `h${headingLevel}` as const;
  return (
    <div className={styles.root}>
      <ol className={styles.timeline}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className={styles.event}>
            <span className={styles.marker} aria-hidden="true" />
            <div className={styles.card}>
              <p className={styles.label}>{item.label}</p>
              <H className={styles.title}>{item.title}</H>
              {item.description && <div className={styles.description}>{item.description}</div>}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Props for Steps. */
export interface StepsProps {
  /** Steps in order. Titles must be unique (used as keys). */
  items: StepItem[];
  /** 1-based index of the step in progress (aria-current="step"); earlier steps show as done. */
  currentStep?: number;
  /** Heading level of each step title. Default 3. */
  headingLevel?: 2 | 3 | 4;
}

/** A numbered sequence. Horizontal from 48rem, vertical below. */
export function Steps({ items, currentStep, headingLevel = 3 }: StepsProps) {
  const H = `h${headingLevel}` as const;
  return (
    <div className={styles.root}>
      <ol className={styles.steps} data-count={items.length}>
        {items.map((item, index) => {
          const number = index + 1;
          const state = currentStep === undefined ? 'todo' : number < currentStep ? 'done' : number === currentStep ? 'current' : 'todo';
          return (
            <li key={item.title} className={styles.step} data-state={state} aria-current={state === 'current' ? 'step' : undefined}>
              <span className={styles.number} aria-hidden="true">
                {state === 'done' ? <Icon name="check" size="sm" /> : number}
              </span>
              <div className={styles.stepText}>
                <H className={styles.title}>
                  {state === 'done' && <span className={styles.visuallyHidden}>Completed: </span>}
                  {item.title}
                </H>
                {item.description && <div className={styles.description}>{item.description}</div>}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
