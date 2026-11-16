import type { Wird } from './wird-store';

export type CycleRecurrence = Wird['recurrence'];

const DAY = 86_400_000;

export function dakarToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dakar',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function dakarDay(value: string): string {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : dakarToday(new Date(value));
}

function utcDay(iso: string): number {
  const [year, month, day] = iso.split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function formatDay(utc: number): string {
  return new Date(utc).toISOString().slice(0, 10);
}

function addDays(iso: string, days: number): string {
  return formatDay(utcDay(iso) + days * DAY);
}

function diffDays(later: string, earlier: string): number {
  return Math.round((utcDay(later) - utcDay(earlier)) / DAY);
}

function weekday(iso: string): number {
  return new Date(utcDay(iso)).getUTCDay();
}

/** Mirrors wirdlink_private.cycle_contains. Dates are Africa/Dakar calendar days. */
export function cycleContains(
  recurrence: CycleRecurrence,
  start: string,
  end: string | null,
  today: string,
  partDay: string,
): boolean {
  if (today < start || (end !== null && today > end)) return false;
  if (recurrence === 'Une fois') return partDay >= start && (end === null || partDay <= end);
  if (recurrence === 'Tous les jours') return partDay === today;
  if (recurrence === 'Chaque semaine') {
    const cycleStart = addDays(start, Math.floor(diffDays(today, start) / 7) * 7);
    let cycleEnd = addDays(cycleStart, 6);
    if (end !== null && cycleEnd > end) cycleEnd = end;
    return partDay >= cycleStart && partDay <= cycleEnd;
  }
  if (recurrence === 'Chaque vendredi') {
    let cycleStart = addDays(today, -((weekday(today) + 2) % 7));
    if (cycleStart < start) cycleStart = start;
    let nextFriday = addDays(cycleStart, (5 - weekday(cycleStart) + 7) % 7);
    if (nextFriday === cycleStart) nextFriday = addDays(cycleStart, 7);
    let cycleEnd = addDays(nextFriday, -1);
    if (end !== null && cycleEnd > end) cycleEnd = end;
    return partDay >= cycleStart && partDay <= cycleEnd;
  }
  return false;
}

export function countsInCurrentCycle(
  wird: Pick<Wird, 'recurrence' | 'startDate' | 'endDate'> | undefined,
  createdAt: string | undefined,
  today: string,
): boolean {
  if (!wird?.startDate || !createdAt) return true;
  return cycleContains(
    wird.recurrence,
    wird.startDate,
    wird.endDate ?? null,
    today,
    dakarDay(createdAt),
  );
}

export function isReminderDay(
  recurrence: CycleRecurrence,
  start: string,
  end: string | null,
  today: string,
): boolean {
  if (recurrence !== 'Chaque semaine' && recurrence !== 'Chaque vendredi') return false;
  const tomorrow = addDays(today, 1);
  return (
    cycleContains(recurrence, start, end, today, today) &&
    !cycleContains(recurrence, start, end, tomorrow, today) &&
    cycleContains(recurrence, start, end, tomorrow, tomorrow)
  );
}

export function dueReminderTitles(
  wirds: Pick<Wird, 'id' | 'title' | 'recurrence' | 'startDate' | 'endDate' | 'isOwner'>[],
  partWirdIds: readonly string[],
  today: string,
): string[] {
  const involved = new Set(partWirdIds);
  return wirds
    .filter(
      (wird) =>
        !!wird.startDate &&
        (wird.isOwner === true || involved.has(wird.id)) &&
        isReminderDay(wird.recurrence, wird.startDate, wird.endDate ?? null, today),
    )
    .map((wird) => wird.title);
}
