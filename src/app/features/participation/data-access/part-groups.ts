import { Part, Wird } from '../../../core/wird-store';
import { dakarDay } from '../../../core/wird-cycle';

export interface PartGroup {
  wirdId: string;
  title: string;
  parts: Part[];
  pending: Part[];
  finished: Part[];
  pendingQuantity: number;
  finishedQuantity: number;
}
export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('fr')
    .trim();
}
export function groupParts(wirds: Wird[], parts: Part[]): PartGroup[] {
  const titles = new Map(wirds.map((wird) => [wird.id, wird.title]));
  const groups = new Map<string, PartGroup>();
  for (const part of parts) {
    let group = groups.get(part.wirdId);
    if (!group) {
      group = {
        wirdId: part.wirdId,
        title: titles.get(part.wirdId) ?? 'Wird indisponible',
        parts: [],
        pending: [],
        finished: [],
        pendingQuantity: 0,
        finishedQuantity: 0,
      };
      groups.set(part.wirdId, group);
    }
    group.parts.push(part);
    if (part.finished) {
      group.finished.push(part);
      group.finishedQuantity += part.quantity;
    } else {
      group.pending.push(part);
      group.pendingQuantity += part.quantity;
    }
  }
  return [...groups.values()];
}
export type PartState = 'taken' | 'progress' | 'done';
export type PartStateFilter = PartState | 'all';

export function groupState(group: PartGroup, progress: ReadonlyMap<string, number>): PartState {
  if (!group.pending.length) return 'done';
  return group.pending.some((part) => (progress.get(part.id) ?? 0) > 0) ? 'progress' : 'taken';
}

const STATE_ORDER: Record<PartState, number> = { progress: 0, taken: 1, done: 2 };

export function sortByState(
  groups: PartGroup[],
  progress: ReadonlyMap<string, number>,
): PartGroup[] {
  return [...groups].sort(
    (a, b) => STATE_ORDER[groupState(a, progress)] - STATE_ORDER[groupState(b, progress)],
  );
}

export type PartPeriod = 'today' | 'yesterday' | 'week' | 'month' | 'older';
export type PartPeriodFilter = 'all' | 'today' | 'week' | 'month';
export const PART_PERIODS: PartPeriod[] = ['today', 'yesterday', 'week', 'month', 'older'];

function shiftDay(iso: string, days: number): string {
  const [year, month, day] = iso.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

function weekStart(today: string): string {
  const [year, month, day] = today.split('-').map(Number);
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  return shiftDay(today, -((weekday + 6) % 7));
}

/** Dakar day of the most recent part of the group, or null when no date is known. */
export function lastPartDay(group: PartGroup): string | null {
  let latest: string | null = null;
  for (const part of group.parts) {
    if (!part.createdAt) continue;
    const day = dakarDay(part.createdAt);
    if (!latest || day > latest) latest = day;
  }
  return latest;
}

export function partPeriod(group: PartGroup, today: string): PartPeriod {
  const day = lastPartDay(group);
  if (!day) return 'older';
  if (day >= today) return 'today';
  if (day === shiftDay(today, -1)) return 'yesterday';
  if (day >= weekStart(today)) return 'week';
  if (day.slice(0, 7) === today.slice(0, 7)) return 'month';
  return 'older';
}

export function matchesPartPeriod(
  group: PartGroup,
  filter: PartPeriodFilter,
  today: string,
): boolean {
  if (filter === 'all') return true;
  const day = lastPartDay(group);
  if (!day) return false;
  const since =
    filter === 'today' ? today : filter === 'week' ? weekStart(today) : today.slice(0, 8) + '01';
  return day >= since;
}

export function matchesPartSearch(group: PartGroup, query: string): boolean {
  const search = normalizeSearch(query);
  return (
    !search ||
    normalizeSearch(group.title).includes(search) ||
    group.parts.some((part) => normalizeSearch(part.name).includes(search))
  );
}
