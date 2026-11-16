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
});
