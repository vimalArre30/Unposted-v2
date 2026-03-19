/**
 * lib/gtag.ts
 * Thin, SSR-safe wrapper around window.gtag (loaded via layout.tsx).
 * Call trackEvent anywhere — no-ops on the server.
 */
export function trackEvent(
  name: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window === 'undefined') return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = (window as any).gtag
  if (typeof g === 'function') g('event', name, params)
}
