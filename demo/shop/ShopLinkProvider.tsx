/*
 * DEMO ONLY. Turns internal links and GET forms into in-memory route changes.
 *
 * - <Link> renders ShopLink (through the library's LinkProvider). A primary click on an internal href
 *   navigates in memory; external links, modified clicks (ctrl, meta, shift, alt, middle button) and
 *   links with a target are left to the browser.
 * - Anchors that don't go through <Link> (rich text from the CMS fixtures) are caught by the same
 *   rule on the wrapper.
 * - GET forms with an internal action (search, filters, sort) become a route change with the form's
 *   fields as the query. Forms whose component already handled the submit (preventDefault) are left
 *   alone; any other form is stopped so the Storybook iframe never navigates.
 * - After each navigation, focus moves to <main> (tabIndex -1, from SiteLayout) and the page scrolls
 *   to the top, as a full page load would.
 */
import { useEffect, useRef, type AnchorHTMLAttributes, type FormEvent, type MouseEvent, type ReactNode } from 'react';
import { LinkProvider, type LinkComponentProps } from '../../src/components/Link';
import { isInternalHref, useShopRouter } from './router';

/** Whether a click on an anchor should become an in-memory navigation. */
export function shouldIntercept(event: MouseEvent, anchor: HTMLAnchorElement): boolean {
  const href = anchor.getAttribute('href') ?? undefined;
  if (event.defaultPrevented || event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;
  if (anchor.target && anchor.target !== '_self') return false;
  if (anchor.hasAttribute('download')) return false;
  return isInternalHref(href);
}

function ShopLink({ onClick, ...rest }: LinkComponentProps & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useShopRouter();
  return (
    <a
      {...rest}
      onClick={(event) => {
        onClick?.(event);
        if (!shouldIntercept(event, event.currentTarget)) return;
        event.preventDefault();
        navigate(event.currentTarget.getAttribute('href')!);
      }}
    />
  );
}

/** The query a GET form would submit: its named, enabled fields (files are skipped). */
export function formQuery(form: HTMLFormElement, submitter?: HTMLElement | null): string {
  const data = new FormData(form, submitter instanceof HTMLButtonElement ? submitter : undefined);
  const params = new URLSearchParams();
  for (const [key, value] of data) if (typeof value === 'string' && value !== '') params.append(key, value);
  return params.toString();
}

export function ShopLinkProvider({ children }: { children: ReactNode }) {
  const { location, navigate } = useShopRouter();
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    window.scrollTo(0, 0);
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [location.href]);

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as Element).closest?.('a[href]');
    if (!(anchor instanceof HTMLAnchorElement) || !shouldIntercept(event, anchor)) return;
    event.preventDefault();
    navigate(anchor.getAttribute('href')!);
  };

  const onSubmit = (event: FormEvent<HTMLDivElement>) => {
    if (event.defaultPrevented) return;
    const form = event.target as HTMLFormElement;
    event.preventDefault();
    const action = form.getAttribute('action') ?? location.path;
    if (form.method.toLowerCase() !== 'get' || !isInternalHref(action)) return;
    const query = formQuery(form, (event.nativeEvent as SubmitEvent).submitter);
    navigate(query ? `${action.split('?')[0]}?${query}` : action);
  };

  return (
    <LinkProvider component={ShopLink}>
      {/* A wrapper with listeners only: it adds no semantics and takes no focus. */}
      <div onClick={onClick} onSubmit={onSubmit} style={{ display: 'contents' }}>
        {children}
      </div>
    </LinkProvider>
  );
}
