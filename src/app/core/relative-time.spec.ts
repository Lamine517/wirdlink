import { relativeTime } from './relative-time';

describe('Relative participation time', () => {
  const now = Date.parse('2026-11-17T10:00:00Z');

  it('says minutes, hours and days in the interface language', () => {
    expect(relativeTime('2026-11-17T09:44:00Z', now, 'fr')).toBe('il y a 16 minutes');
    expect(relativeTime('2026-11-17T07:00:00Z', now, 'fr')).toBe('il y a 3 heures');
    expect(relativeTime('2026-11-16T09:00:00Z', now, 'fr')).toBe('hier');
    expect(relativeTime('2026-11-14T09:00:00Z', now, 'fr')).toBe('il y a 3 jours');
    expect(relativeTime('2026-11-17T09:44:00Z', now, 'en')).toBe('16 minutes ago');
  });

  it('leaves the last minute and invalid dates to the caller', () => {
    expect(relativeTime('2026-11-17T09:59:30Z', now, 'fr')).toBeNull();
    expect(relativeTime('not a date', now, 'fr')).toBeNull();
  });
});
