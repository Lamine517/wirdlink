import {
  groupParts,
  groupState,
  matchesPartPeriod,
  matchesPartSearch,
  partPeriod,
  sortByState,
} from './part-groups';
import { Part, Wird } from '../../../core/wird-store';

const wirds: Wird[] = [
  {
    id: 'one',
    title: 'Wird du vendredi',
    target: 1000,
    completed: 600,
    recurrence: 'Chaque vendredi',
    visibility: 'public',
  },
];
const parts: Part[] = [
  { id: 'a', wirdId: 'one', quantity: 200, name: '', finished: true },
  { id: 'b', wirdId: 'one', quantity: 150, name: 'Mamy', finished: true },
  { id: 'c', wirdId: 'one', quantity: 10, name: 'Mamy', finished: true },
  { id: 'd', wirdId: 'one', quantity: 20, name: 'Éva', finished: false },
];

describe('Grouped parts', () => {
  it('keeps one card per wird and retains every completion action', () => {
    const groups = groupParts(wirds, parts);
    expect(groups.length).toBe(1);
    expect(groups[0].finishedQuantity).toBe(360);
    expect(groups[0].pendingQuantity).toBe(20);
    expect(groups[0].pending[0].id).toBe('d');
    expect(groups[0].finished.length).toBe(3);
  });
  it('finds titles and names without case or accent sensitivity', () => {
    const group = groupParts(wirds, parts)[0];
    expect(matchesPartSearch(group, ' VENDREDI ')).toBeTrue();
    expect(matchesPartSearch(group, 'eva')).toBeTrue();
    expect(matchesPartSearch(group, 'unknown')).toBeFalse();
    expect(matchesPartSearch(group, '')).toBeTrue();
  });
  it('tells taken, counting and finished wirds apart and lists counting ones first', () => {
    const [group] = groupParts(wirds, parts);
    expect(groupState(group, new Map())).toBe('taken');
    expect(groupState(group, new Map([['d', 3]]))).toBe('progress');
    const done = groupParts(wirds, parts.filter((part) => part.finished))[0];
    expect(groupState(done, new Map())).toBe('done');
    const sorted = sortByState([done, group], new Map([['d', 3]]));
    expect(sorted[0]).toBe(group);
  });
  it('files a wird under the day of its latest part, in Dakar time', () => {
    // Wednesday 18 November 2026; the week starts on Monday 16.
    const today = '2026-11-18';
    const at = (createdAt?: string) =>
      groupParts(wirds, [{ ...parts[3], createdAt }, { ...parts[0], createdAt: '2026-10-01T10:00:00Z' }])[0];
    expect(partPeriod(at('2026-11-18T23:30:00Z'), today)).toBe('today');
    expect(partPeriod(at('2026-11-17T08:00:00Z'), today)).toBe('yesterday');
    expect(partPeriod(at('2026-11-16T08:00:00Z'), today)).toBe('week');
    expect(partPeriod(at('2026-11-02T08:00:00Z'), today)).toBe('month');
    expect(partPeriod(at('2026-10-31T08:00:00Z'), today)).toBe('older');
    expect(partPeriod(groupParts(wirds, [parts[3]])[0], today)).toBe('older');
    expect(matchesPartPeriod(at('2026-11-16T08:00:00Z'), 'week', today)).toBeTrue();
    expect(matchesPartPeriod(at('2026-11-16T08:00:00Z'), 'today', today)).toBeFalse();
    expect(matchesPartPeriod(at('2026-11-01T08:00:00Z'), 'month', today)).toBeTrue();
    expect(matchesPartPeriod(groupParts(wirds, [parts[3]])[0], 'month', today)).toBeFalse();
    expect(matchesPartPeriod(groupParts(wirds, [parts[3]])[0], 'all', today)).toBeTrue();
  });
});
