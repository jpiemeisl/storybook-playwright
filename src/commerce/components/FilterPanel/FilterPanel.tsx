import { useId, type ReactNode } from 'react';
import { Button } from '../../../components/Button';
import { Checkbox } from '../../../components/Checkbox';
import { Field } from '../../../components/Field';
import { Input } from '../../../components/Input';
import { Radio, RadioGroup } from '../../../components/Radio';
import type { Facets, FacetValue, FilterState, SortKey } from '../../logic/browse';
import styles from './FilterPanel.module.css';

export interface FilterPanelProps {
  facets: Facets;
  value: FilterState;
  /** Live mode: every change calls this. Without it the panel is a plain GET form (submit with Apply). */
  onChange?: (state: FilterState) => void;
  /** Where the GET form submits. Default "" (the current page). */
  action?: string;
  /** Kept in a hidden field so applying filters does not reset the sort. */
  sort?: SortKey;
  /** Currency symbol shown with the price inputs. Default "$". */
  currencySymbol?: string;
  /** Form id, so a SortSelect elsewhere can join it. */
  id?: string;
}

const SHOW = 6;
const toggle = (list: string[], value: string, on: boolean) => (on ? [...new Set([...list, value])] : list.filter((v) => v !== value));
const label = (facet: FacetValue) => `${facet.label} (${facet.count})`;

/**
 * Filters as a real `<form method="get">` with native, named controls, so it works without JavaScript
 * (Apply submits the query parameters parseFilters reads). With `onChange` it is also live.
 * Facet counts are in the labels; zero-count values are disabled but visible (unless selected).
 */
export function FilterPanel({ facets, value, onChange, action = '', sort, currencySymbol = '$', id }: FilterPanelProps) {
  const live = !!onChange;
  const set = (patch: Partial<FilterState>) => onChange?.({ ...value, ...patch });
  const minId = useId();
  const priceErrorId = useId();
  const min = value.price?.min;
  const max = value.price?.max;
  const priceError = min !== undefined && max !== undefined && min > max ? 'The minimum price is higher than the maximum.' : undefined;
  const checkedProps = (checked: boolean) => (live ? { checked } : { defaultChecked: checked });
  const setPrice = (key: 'min' | 'max', raw: string) => {
    const n = raw.trim() === '' ? undefined : Math.max(0, Math.round(Number(raw) * 100));
    const price = { ...value.price, [key]: Number.isFinite(n) ? n : undefined };
    set({ price: price.min === undefined && price.max === undefined ? undefined : price });
  };

  const groups: { key: string; title: string; content: ReactNode }[] = [];

  if (facets.kinds.length > 1) {
    groups.push({
      key: 'kind',
      title: 'Product type',
      content: (
        <List
          values={facets.kinds}
          render={(facet) => {
            const checked = value.kinds.includes(facet.value as never);
            return (
              <Checkbox
                name="kind"
                value={facet.value}
                label={label(facet)}
                disabled={facet.count === 0 && !checked}
                {...checkedProps(checked)}
                onChange={(e) => set({ kinds: toggle(value.kinds, facet.value, e.target.checked) as FilterState['kinds'] })}
              />
            );
          }}
        />
      ),
    });
  }

  for (const option of facets.options) {
    const selected = value.options[option.name] ?? [];
    const style = option.display === 'swatches' ? 'swatches' : 'chips';
    groups.push({
      key: `o.${option.name}`,
      title: option.name,
      content: (
        <List
          values={option.values}
          className={styles[style]}
          render={(facet) => {
            const checked = selected.includes(facet.value);
            const colour = option.swatches?.[facet.value];
            return (
              <label className={[styles.chip, facet.count === 0 && !checked && styles.disabled].filter(Boolean).join(' ')}>
                <input
                  type="checkbox"
                  className={styles.chipInput}
                  name={`o.${option.name}`}
                  value={facet.value}
                  disabled={facet.count === 0 && !checked}
                  {...checkedProps(checked)}
                  onChange={(e) => {
                    const values = toggle(selected, facet.value, e.target.checked);
                    const options = { ...value.options, [option.name]: values };
                    if (values.length === 0) delete options[option.name];
                    set({ options });
                  }}
                />
                {style === 'swatches' && colour && <span className={styles.swatch} style={{ backgroundColor: colour }} aria-hidden="true" />}
                <span>{label(facet)}</span>
              </label>
            );
          }}
        />
      ),
    });
  }

  if (facets.tags.length) {
    groups.push({
      key: 'tag',
      title: 'Tags',
      content: (
        <List
          values={facets.tags}
          render={(facet) => {
            const checked = value.tags.includes(facet.value);
            return <Checkbox name="tag" value={facet.value} label={label(facet)} disabled={facet.count === 0 && !checked} {...checkedProps(checked)} onChange={(e) => set({ tags: toggle(value.tags, facet.value, e.target.checked) })} />;
          }}
        />
      ),
    });
  }

  groups.push({
    key: 'price',
    title: 'Price',
    content: (
      <div className={styles.price}>
        <Field label="Minimum" hint={`In ${currencySymbol}, whole amounts`} id={minId}>
          <Input
            type="number"
            name="price_min"
            min={0}
            inputMode="decimal"
            startAdornment={currencySymbol}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={priceError ? priceErrorId : undefined}
            {...(live ? { value: min === undefined ? '' : String(min / 100), onChange: (e) => setPrice('min', e.target.value) } : { defaultValue: min === undefined ? '' : String(min / 100) })}
          />
        </Field>
        <Field label="Maximum" hint={`In ${currencySymbol}, whole amounts`}>
          <Input
            type="number"
            name="price_max"
            min={0}
            inputMode="decimal"
            startAdornment={currencySymbol}
            aria-invalid={priceError ? true : undefined}
            aria-describedby={priceError ? priceErrorId : undefined}
            {...(live ? { value: max === undefined ? '' : String(max / 100), onChange: (e) => setPrice('max', e.target.value) } : { defaultValue: max === undefined ? '' : String(max / 100) })}
          />
        </Field>
        {priceError && (
          <p id={priceErrorId} className={styles.error} role="alert">
            {priceError}
          </p>
        )}
      </div>
    ),
  });

  groups.push({
    key: 'availability',
    title: 'Availability',
    content: (
      <div className={styles.list}>
        <Checkbox name="in_stock" value="1" label={`In stock only (${facets.inStock})`} {...checkedProps(value.availability === 'in-stock')} onChange={(e) => set({ availability: e.target.checked ? 'in-stock' : 'all' })} />
        <Checkbox name="on_sale" value="1" label={`On sale (${facets.onSale})`} disabled={facets.onSale === 0 && !value.onSale} {...checkedProps(value.onSale)} onChange={(e) => set({ onSale: e.target.checked })} />
      </div>
    ),
  });

  groups.push({
    key: 'rating',
    title: 'Customer rating',
    content: (
      <RadioGroup
        legend="Minimum rating"
        name="rating"
        className={styles.ratingGroup}
        {...(live ? { value: value.minRating ? String(value.minRating) : '', onChange: (v: string) => set({ minRating: v ? Number(v) : undefined }) } : { defaultValue: value.minRating ? String(value.minRating) : '' })}
      >
        <Radio value="" label="Any rating" />
        {facets.ratings.map((facet) => (
          <Radio key={facet.value} value={facet.value} label={label(facet)} disabled={facet.count === 0 && String(value.minRating) !== facet.value} />
        ))}
      </RadioGroup>
    ),
  });

  return (
    <form id={id} method="get" action={action} className={styles.panel} aria-label="Filters" onSubmit={(e) => live && e.preventDefault()}>
      {value.query && <input type="hidden" name="q" value={value.query} />}
      {sort && sort !== 'featured' && <input type="hidden" name="sort" value={sort} />}
      {groups.map((group, index) => (
        <details key={group.key} className={styles.group} open={index === 0 || undefined}>
          <summary className={styles.summary}>{group.title}</summary>
          <fieldset className={styles.fieldset}>
            <legend className={styles.visuallyHidden}>{group.title}</legend>
            {group.content}
          </fieldset>
        </details>
      ))}
      <div className={styles.actions}>
        <Button type="submit" variant={live ? 'secondary' : 'primary'} size="sm">
          Apply filters
        </Button>
      </div>
    </form>
  );
}

/** Values with a native "Show N more" disclosure after the first six. */
function List({ values, render, className }: { values: FacetValue[]; render: (facet: FacetValue) => ReactNode; className?: string }) {
  const first = values.slice(0, SHOW);
  const rest = values.slice(SHOW);
  const items = (list: FacetValue[]) => list.map((facet) => <li key={facet.value}>{render(facet)}</li>);
  return (
    <>
      <ul className={[styles.list, className].filter(Boolean).join(' ')}>{items(first)}</ul>
      {rest.length > 0 && (
        <details className={styles.more}>
          <summary className={styles.moreSummary}>Show {rest.length} more</summary>
          <ul className={[styles.list, className].filter(Boolean).join(' ')}>{items(rest)}</ul>
        </details>
      )}
    </>
  );
}
