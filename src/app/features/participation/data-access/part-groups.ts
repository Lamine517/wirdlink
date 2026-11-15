import { Part, Wird } from '../../../core/wird-store';

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
export function matchesPartSearch(group: PartGroup, query: string): boolean {
  const search = normalizeSearch(query);
  return (
    !search ||
    normalizeSearch(group.title).includes(search) ||
    group.parts.some((part) => normalizeSearch(part.name).includes(search))
  );
}
