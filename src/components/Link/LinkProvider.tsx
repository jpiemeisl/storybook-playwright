import { createContext, useContext, type AnchorHTMLAttributes, type ComponentType, type ReactNode } from 'react';

/** Props every injected link component must accept. Matches the shape of `<a>`. */
export type LinkComponentProps = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

/** `'a'` or any component that renders an anchor, e.g. Next.js `Link` or a React Router adapter. */
export type LinkComponent = 'a' | ComponentType<LinkComponentProps>;

const LinkComponentContext = createContext<LinkComponent>('a');

export interface LinkProviderProps {
  /** Element used by `<Link>` for internal navigation. */
  component: LinkComponent;
  children: ReactNode;
}

export function LinkProvider({ component, children }: LinkProviderProps) {
  return <LinkComponentContext.Provider value={component}>{children}</LinkComponentContext.Provider>;
}

export function useLinkComponent(): LinkComponent {
  return useContext(LinkComponentContext);
}
