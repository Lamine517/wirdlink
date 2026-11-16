import { Part } from '../../../core/wird-store';

export interface ParticipantGroup {
  key: string;
  name: string;
  count: number;
  completed: number;
  pending: number;
}

/** Groups display names, never claims that equal names represent the same person. */
export function groupParticipants(parts: readonly Part[]): ParticipantGroup[] {
  const groups = new Map<string, ParticipantGroup>();
  for (const part of parts) {
    const name = part.name.trim();
    const key = name.normalize('NFC').toLocaleLowerCase('fr');
    const group = groups.get(key) ?? { key, name, count: 0, completed: 0, pending: 0 };
    group.count++;
    if (part.finished) group.completed += part.quantity;
    else group.pending += part.quantity;
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => {
    if (!a.name) return b.name ? 1 : 0;
    if (!b.name) return -1;
    return a.name.localeCompare(b.name, 'fr');
  });
}
