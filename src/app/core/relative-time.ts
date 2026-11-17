const UNITS: readonly [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * 86_400],
  ['month', 30 * 86_400],
  ['week', 7 * 86_400],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
];

/** Returns null under a minute so the caller can say "just now" in its own words. */
export function relativeTime(iso: string, now: number, locale: string): string | null {
  const elapsed = Math.round((now - Date.parse(iso)) / 1000);
  if (Number.isNaN(elapsed) || elapsed < 60) return null;
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, seconds] of UNITS) {
    if (elapsed >= seconds) return format.format(-Math.floor(elapsed / seconds), unit);
  }
  return null;
}
