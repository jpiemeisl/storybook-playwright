import { Accordion, type AccordionItem } from '../../../components/Accordion';
import { Prose } from '../../../components/Prose';
import { neutralizeUnsafeUrls } from '../../../registry/links';
import type { Product } from '../../types/product';
import { DELIVERY_COPY } from '../DeliveryInfo';
import { freeShippingText } from '../DeliveryInfo/DeliveryInfo';

const html = (text: string) => <Prose sanitizedHtml={neutralizeUnsafeUrls(text).html} />;

/** Kind-specific default sections, used when the product does not define one with the same id. */
export function defaultInfoSections(product: Product): AccordionItem[] {
  if (product.kind === 'digital') {
    const files = product.digital?.files ?? [];
    return [
      { id: 'included', title: 'What’s included', content: html(`<ul>${files.map((f) => `<li>${escape(f.name)} (${escape(f.format)})</li>`).join('')}</ul>`) },
      { id: 'licence', title: 'License', content: html(`<p>${escape(product.digital?.licence?.summary ?? 'Personal use by one person.')}</p>`) },
    ];
  }
  if (product.kind === 'subscription') {
    const terms = product.subscription;
    return [
      { id: 'plan', title: 'Plan details', content: html(`<p>${escape(terms?.billingNote ?? 'Billed at the start of each period.')}</p>`) },
      { id: 'cancel', title: terms?.cancelAnytime === false ? 'Minimum term' : 'Cancel anytime', content: html(terms?.minimumTermMonths ? `<p>Minimum term ${terms.minimumTermMonths} months, then cancel anytime.</p>` : '<p>Cancel from your account before the next billing date and you won’t be charged again.</p>') },
    ];
  }
  return [{ id: 'shipping', title: 'Shipping and returns', content: html(`<p>${[DELIVERY_COPY.dispatch, freeShippingText(product), DELIVERY_COPY.returns].filter(Boolean).join('. ')}.</p>`) }];
}

function escape(text: string) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

/** The product's infoSections (rich text) followed by kind-specific defaults, in an Accordion. */
export function ProductInfoAccordion({ product, headingLevel = 3 }: { product: Product; headingLevel?: 2 | 3 | 4 }) {
  const own: AccordionItem[] = (product.infoSections ?? []).map((section) => ({ id: section.id, title: section.title, content: html(section.content.html) }));
  const defaults = defaultInfoSections(product).filter((d) => !own.some((o) => o.id === d.id));
  return <Accordion items={[...own, ...defaults]} headingLevel={headingLevel} allowMultiple />;
}
