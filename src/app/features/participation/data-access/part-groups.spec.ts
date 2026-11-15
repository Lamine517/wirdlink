import { groupParts, matchesPartSearch } from './part-groups';
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
});
