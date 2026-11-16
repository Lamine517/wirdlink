import { countsInCurrentCycle, dueReminderTitles, isReminderDay } from './wird-cycle';

const monday = '2026-11-16';
const thursday = '2026-11-19';
const friday = '2026-11-20';
const nextMonday = '2026-11-23';

describe('Wird cycles', () => {
  it('keeps a single objective until the wird ends', () => {
    expect(countsInCurrentCycle(wird('Une fois', monday), monday, thursday)).toBeTrue();
    expect(countsInCurrentCycle(wird('Une fois', monday, thursday), friday, friday)).toBeFalse();
    expect(isReminderDay('Une fois', monday, null, thursday)).toBeFalse();
  });

  it('restarts the objective every day', () => {
    expect(countsInCurrentCycle(wird('Tous les jours', monday), monday, thursday)).toBeFalse();
    expect(countsInCurrentCycle(wird('Tous les jours', monday), thursday, thursday)).toBeTrue();
    expect(isReminderDay('Tous les jours', monday, null, thursday)).toBeFalse();
  });

  it('restarts a weekly objective on the weekday it started and reminds the day before', () => {
    expect(countsInCurrentCycle(wird('Chaque semaine', monday), monday, thursday)).toBeTrue();
    expect(countsInCurrentCycle(wird('Chaque semaine', monday), monday, nextMonday)).toBeFalse();
    expect(countsInCurrentCycle(wird('Chaque semaine', monday), nextMonday, nextMonday)).toBeTrue();
    expect(isReminderDay('Chaque semaine', monday, null, '2026-11-21')).toBeFalse();
    expect(isReminderDay('Chaque semaine', monday, null, '2026-11-22')).toBeTrue();
  });

  it('restarts a Friday objective each Friday and reminds on Thursday', () => {
    expect(countsInCurrentCycle(wird('Chaque vendredi', monday), monday, thursday)).toBeTrue();
    expect(countsInCurrentCycle(wird('Chaque vendredi', monday), thursday, friday)).toBeFalse();
    expect(countsInCurrentCycle(wird('Chaque vendredi', monday), friday, friday)).toBeTrue();
    expect(isReminderDay('Chaque vendredi', monday, null, thursday)).toBeTrue();
    expect(isReminderDay('Chaque vendredi', monday, null, friday)).toBeFalse();
    expect(isReminderDay('Chaque vendredi', monday, thursday, thursday)).toBeFalse();
  });

  it('reminds only the owner and current participants', () => {
    const weekly = {
      id: 'weekly',
      title: 'Famille',
      recurrence: 'Chaque semaine' as const,
      startDate: monday,
      isOwner: false,
    };
    expect(dueReminderTitles([weekly], [], '2026-11-22')).toEqual([]);
    expect(dueReminderTitles([{ ...weekly, isOwner: true }], [], '2026-11-22')).toEqual(['Famille']);
    expect(dueReminderTitles([weekly], ['weekly'], '2026-11-22')).toEqual(['Famille']);
  });
});

function wird(recurrence: 'Une fois' | 'Tous les jours' | 'Chaque semaine' | 'Chaque vendredi', start: string, end?: string) {
  return { recurrence, startDate: start, endDate: end };
}
