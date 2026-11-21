import type { ReactNode } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { PageHeader } from '../components/PageHeader';
import type { TemplateHeading } from '../content-types/templates';
import { isSafeHref } from '../registry/links';

/**
 * The h1 page header used by structured templates. Breadcrumb links that are unsafe render as text
 * (they are reported by validatePage).
 */
export function ListingHeader({ heading, meta, actions }: { heading: TemplateHeading; meta?: ReactNode; actions?: ReactNode }) {
  const crumbs = heading.breadcrumbs?.map((item) => (item.href && !isSafeHref(item.href) ? { label: item.label } : item));
  return (
    <PageHeader
      title={heading.title}
      description={heading.description}
      breadcrumbs={crumbs?.length ? <Breadcrumbs items={crumbs} /> : undefined}
      meta={meta}
      actions={actions}
      headingLevel={1}
    />
  );
}
