import { useEffect, useState, type RefObject } from 'react';

/**
 * True while the referenced element is entirely outside the viewport. Uses an IntersectionObserver in an
 * effect; where IntersectionObserver is unavailable (old browsers, some test environments) it stays false,
 * so anything shown "only when out of view" stays hidden.
 */
export function useOutOfView(ref: RefObject<Element | null>, enabled = true): boolean {
  const [outOfView, setOutOfView] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(([entry]) => setOutOfView(!entry!.isIntersecting));
    observer.observe(node);
    return () => {
      observer.disconnect();
      setOutOfView(false);
    };
  }, [ref, enabled]);
  return outOfView;
}
