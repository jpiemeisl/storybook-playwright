import { createContext, useContext, type AnchorHTMLAttributes, type ComponentType, type ReactNode } from 'react';

/** Props every injected link component must accept. Matches the shape of `<a>`. */
export type LinkComponentProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** `'a'` or any component that renders an anchor, e.g. Next.js `Link` or a React Router adapter. */
export type LinkComponent = 'a' | ComponentType<LinkComponentProps>;

const LinkComponentContext = createContext<LinkComponent>('a');

/** Props for LinkProvider. */
export interface LinkProviderProps {
  /** Element used by `<Link>` for internal navigation. */
  component: LinkComponent;
  children: ReactNode;
}

/**
 * Sets the component that Link (and ButtonLink) use for internal links, e.g. the host app's router link.
 * Wrap the app once near the root; without a provider, internal links render a plain `<a>`.
 */
export function LinkProvider({ component, children }: LinkProviderProps) {
  return <LinkComponentContext.Provider value={component}>{children}</LinkComponentContext.Provider>;
}

/** Returns the link component set by the nearest LinkProvider, or `'a'` when there is none. */
export function useLinkComponent(): LinkComponent {
  return useContext(LinkComponentContext);
}
