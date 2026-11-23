import { useId, useRef, useState, type FocusEvent, type KeyboardEvent, type ReactNode } from 'react';
import styles from './Tabs.module.css';

/** One tab: its label in the tab list and the panel content it shows. */
export interface TabItem {
  /** Unique within the Tabs. Used for `value`/`defaultValue`/`onChange` and to build element ids. */
  id: string;
  /** Content of the tab button. */
  label: ReactNode;
  /** Content of the tab panel. Panels of unselected tabs stay in the DOM but are hidden. */
  content: ReactNode;
}

/** Props for Tabs. The selected tab can be controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). */
export interface TabsProps {
  tabs: TabItem[];
  /** Accessible name of the tab list. */
  label: string;
  /** Controlled selected tab id. */
  value?: string;
  /** Uncontrolled initial tab id. Default: the first tab. */
  defaultValue?: string;
  /** Called with the id of the newly selected tab. */
  onChange?: (id: string) => void;
  /** `automatic`: arrow keys select. `manual`: arrow keys move focus; Enter/Space select. */
  activation?: 'automatic' | 'manual';
  /** `vertical` puts the tab list beside the panels and uses ArrowUp/ArrowDown. Default "horizontal". */
  orientation?: 'horizontal' | 'vertical';
}

/**
 * WAI-ARIA tabs with roving tabindex. ArrowLeft/ArrowRight (ArrowUp/ArrowDown when vertical), Home and
 * End move between tabs. The tab list scrolls horizontally on narrow containers.
 */
export function Tabs({
  tabs,
  label,
  value,
  defaultValue,
  onChange,
  activation = 'automatic',
  orientation = 'horizontal',
}: TabsProps) {
  const baseId = useId();
  const listRef = useRef<HTMLDivElement>(null);
  const [internal, setInternal] = useState(defaultValue ?? tabs[0]?.id);
  const selected = value ?? internal;
  // The tab with focus while focus is inside the tab list (manual mode's roving tabindex); unset otherwise.
  const [focused, setFocused] = useState<string | undefined>(undefined);
  const tabId = (id: string) => `${baseId}-tab-${id}`;
  const panelId = (id: string) => `${baseId}-panel-${id}`;

  const select = (id: string) => {
    if (value === undefined) setInternal(id);
    onChange?.(id);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const index = tabs.findIndex((tab) => tab.id === event.currentTarget.dataset.tabId);
    const last = tabs.length - 1;
    const prevKey = orientation === 'vertical' ? 'ArrowUp' : 'ArrowLeft';
    const nextKey = orientation === 'vertical' ? 'ArrowDown' : 'ArrowRight';
    const targets: Record<string, number> = {
      [prevKey]: index === 0 ? last : index - 1,
      [nextKey]: index === last ? 0 : index + 1,
      Home: 0,
      End: last,
    };
    const next = targets[event.key];
    if (next === undefined) return;
    event.preventDefault();
    const nextTab = tabs[next]!;
    listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-id="${CSS.escape(nextTab.id)}"]`)?.focus();
    if (activation === 'automatic') select(nextTab.id);
  };

  // Forget the focused tab only when focus leaves the tab list, not when it moves between tabs: the
  // old tab's blur fires during the arrow-key handler and must not undo the move.
  const onListBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(undefined);
  };

  return (
    // Outer element is the query container; the inner one changes layout (a container can't query itself).
    <div className={styles.root}>
      <div className={[styles.tabs, styles[orientation]].join(' ')}>
        <div
          ref={listRef}
          role="tablist"
          aria-label={label}
          aria-orientation={orientation}
          className={styles.list}
          onBlur={onListBlur}
        >
          {tabs.map((tab) => {
            const isSelected = tab.id === selected;
            // Roving tabindex: only the selected tab (or, mid-navigation in manual mode, the focused one) is tabbable.
            const tabbable = activation === 'manual' ? tab.id === (focused ?? selected) : isSelected;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={tabId(tab.id)}
                data-tab-id={tab.id}
                aria-selected={isSelected}
                aria-controls={panelId(tab.id)}
                tabIndex={tabbable ? 0 : -1}
                className={styles.tab}
                onClick={() => select(tab.id)}
                onKeyDown={onKeyDown}
                onFocus={() => setFocused(tab.id)}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={panelId(tab.id)}
            aria-labelledby={tabId(tab.id)}
            hidden={tab.id !== selected}
            tabIndex={0}
            className={styles.panel}
          >
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  );
}
