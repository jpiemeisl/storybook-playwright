/**
 * Formats an ISO 8601 date for display, e.g. "2026-03-14" → "Mar 14, 2026".
 * Uses UTC so server and client render the same text regardless of the viewer's time zone.
 */
export function formatIsoDate(iso: string, locale = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
}
