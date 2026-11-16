import { Injectable, inject, signal } from '@angular/core';
import { Part, WirdStore } from '../../../core/wird-store';

export interface HapticPreferences {
  atGoal: boolean;
  onTap: boolean;
}
const STORAGE_KEY = 'wirdlink.tasbih.v1';

function readPreferences(value: unknown): HapticPreferences {
  if (
    !value ||
    typeof value !== 'object' ||
    !('atGoal' in value) ||
    !('onTap' in value) ||
    typeof value.atGoal !== 'boolean' ||
    typeof value.onTap !== 'boolean'
  )
    throw new Error('Invalid preferences');
  return { atGoal: value.atGoal, onTap: value.onTap };
}

function isCountEntry(value: unknown): value is [string, number] {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    typeof value[0] === 'string' &&
    typeof value[1] === 'number' &&
    Number.isSafeInteger(value[1]) &&
    value[1] >= 0
  );
}

function readProgress(value: unknown, parts: readonly Part[]): ReadonlyMap<string, number> {
  if (!Array.isArray(value) || value.length > 10000) throw new Error('Invalid counters');
  const active = new Map(
    parts.filter((part) => !part.finished).map((part) => [part.id, part.quantity]),
  );
  const restored = new Map<string, number>();
  for (const entry of value) {
    if (!isCountEntry(entry) || restored.has(entry[0])) throw new Error('Invalid count');
    const quantity = active.get(entry[0]);
    if (quantity === undefined) continue;
    if (entry[1] > quantity) throw new Error('Count above reserved quantity');
    restored.set(entry[0], entry[1]);
  }
  return restored;
}

@Injectable({ providedIn: 'root' })
export class TasbihStore {
  private readonly wirds = inject(WirdStore);
  private readonly counts = signal<ReadonlyMap<string, number>>(new Map());
  readonly progress = this.counts.asReadonly();
  private readonly preferences = signal<HapticPreferences>({ atGoal: true, onTap: false });
  readonly haptics = this.preferences.asReadonly();
  readonly warning = signal('');

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const value: unknown = JSON.parse(raw);
      if (!value || typeof value !== 'object') throw new Error('Invalid counter state');
      const state = value as Record<string, unknown>;
      if (state['version'] !== 1) throw new Error('Invalid counter version');
      const preferences = readPreferences(state['haptics']);
      const restored = readProgress(state['counts'], this.wirds.parts());
      this.counts.set(restored);
      this.preferences.set(preferences);
    } catch {
      this.warning.set(
        'Le compteur enregistré n’a pas pu être restauré. Votre part reste réservée.',
      );
    }
  }

  count(partId: string): number {
    return this.counts().get(partId) ?? 0;
  }

  increment(partId: string): boolean {
    const part = this.wirds.parts().find((part) => part.id === partId && !part.finished);
    if (!part || this.count(partId) >= part.quantity) return false;
    this.writeCount(partId, this.count(partId) + 1);
    return true;
  }

  undo(partId: string): void {
    if (!this.pending(partId) || this.count(partId) === 0) return;
    this.writeCount(partId, this.count(partId) - 1);
  }

  reset(partId: string): void {
    if (this.pending(partId)) this.writeCount(partId, 0);
  }

  forget(partId: string): void {
    const next = new Map(this.counts());
    next.delete(partId);
    this.counts.set(next);
    this.persist();
  }

  setHapticPreference(key: keyof HapticPreferences, enabled: boolean): void {
    this.preferences.update((value) => ({ ...value, [key]: enabled }));
    this.persist();
  }

  private pending(partId: string): boolean {
    return this.wirds.parts().some((part) => part.id === partId && !part.finished);
  }

  private writeCount(partId: string, count: number): void {
    this.counts.set(new Map(this.counts()).set(partId, count));
    this.persist();
  }

  private persist(): void {
    try {
      const active = new Set(this.wirds.activeParts().map((part) => part.id));
      const counts = [...this.counts()].filter(([id]) => active.has(id));
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ version: 1, counts, haptics: this.haptics() }),
      );
    } catch {
      this.warning.set(
        'Sauvegarde indisponible. Gardez cette page ouverte pour conserver le compteur.',
      );
    }
  }
}
