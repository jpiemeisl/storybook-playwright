import type { ReactNode } from 'react';
import styles from './Placeholder.module.css';

/* Story-only helpers. Not exported from the library. */

export function Placeholder({ title, children }: { title: ReactNode; children?: ReactNode }) {
  return (
    <div className={styles.placeholder}>
      <p className={styles.title}>{title}</p>
      {children && <p className={styles.body}>{children}</p>}
    </div>
  );
}

/** Full-width bar that makes a container's content box visible. */
export function Ruler({ children }: { children: ReactNode }) {
  return <div className={styles.ruler}>{children}</div>;
}

export const services = [
  { title: 'Discovery workshops', body: 'Two days with your team to map goals, users and constraints.' },
  { title: 'Design systems', body: 'Tokens, components and documentation your developers will actually use.' },
  { title: 'Accessibility audits', body: 'WCAG 2.2 review with prioritised, developer-ready fixes.' },
  { title: 'Performance tuning', body: 'Core Web Vitals analysis and a plan to get every page into the green.' },
  { title: 'Content strategy', body: 'Information architecture and editorial guidelines.' },
  { title: 'Front-end engineering', body: 'React and TypeScript delivery alongside your in-house team.' },
  { title: 'Usability testing', body: 'Moderated sessions with real customers, summarised within a week.' },
  { title: 'Analytics setup', body: 'Privacy-respecting measurement wired to the outcomes you care about.' },
  { title: 'Migration planning', body: 'Phased moves off legacy platforms without a big-bang launch.' },
  { title: 'Team coaching', body: 'Pairing and reviews to level up practices that stick.' },
  { title: 'Prototyping', body: 'Clickable prototypes to test ideas before writing production code.' },
  { title: 'Support retainer', body: 'A monthly block of hours for fixes, upgrades and small features.' },
];

export const longUnbrokenString =
  'https://example.com/a/very/long/path/without/any/spaces/that/would/normally/overflow/its/container/unless/the/layout/allows/it/to/wrap';
