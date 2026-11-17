import { groupParticipants } from './participant-groups';

describe('Participant display grouping', () => {
  it('groups chosen names and anonymous parts without confusing reserved and completed quantities', () => {
    const groups = groupParticipants([
      { id: '1', wirdId: 'w', name: ' Awa ', quantity: 100, finished: true },
      { id: '2', wirdId: 'w', name: 'awa', quantity: 50, finished: false },
      { id: '3', wirdId: 'w', name: '', quantity: 20, finished: true },
      { id: '4', wirdId: 'w', name: ' ', quantity: 10, finished: false },
    ]);
    expect(groups.length).toBe(2);
    expect(groups[0]).toEqual({ key: 'awa', name: 'Awa', count: 2, completed: 100, pending: 50 });
    expect(groups[1]).toEqual({ key: '', name: '', count: 2, completed: 20, pending: 10 });
  });

  it('keeps the most recent participation time of each name', () => {
    const [group] = groupParticipants([
      { id: '1', wirdId: 'w', name: 'Awa', quantity: 1, finished: true, createdAt: '2026-11-16T08:00:00Z' },
      { id: '2', wirdId: 'w', name: 'Awa', quantity: 1, finished: false, createdAt: '2026-11-17T09:00:00Z' },
    ]);
    expect(group.lastAt).toBe('2026-11-17T09:00:00Z');
  });
});
