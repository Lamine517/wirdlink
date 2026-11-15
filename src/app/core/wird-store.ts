import { computed, Injectable, signal } from '@angular/core';

export interface Wird {
  id: string;
  title: string;
  recurrence: 'Chaque vendredi' | 'Tous les jours';
  target: number;
  completed: number;
}
export interface Part {
  id: string;
  wirdId: string;
  quantity: number;
  name: string;
  finished: boolean;
}
const INITIAL_WIRDS: Wird[] = [
  {
    id: 'salat-nabi',
    title: 'Salat ala Nabi',
    recurrence: 'Chaque vendredi',
    target: 1000,
    completed: 600,
  },
  {
    id: 'salat-fatihi',
    title: '1 000 Salatoul Fatihi',
    recurrence: 'Tous les jours',
    target: 1000,
    completed: 600,
  },
];
const STORAGE_KEY = 'wirdlink.demo.v1';

@Injectable({ providedIn: 'root' })
export class WirdStore {
  readonly wirds = signal<Wird[]>(INITIAL_WIRDS.map((wird) => ({ ...wird })));
  readonly parts = signal<Part[]>([]);
  readonly savedName = signal('');
  readonly storageWarning = signal('');
  readonly activeParts = computed(() => this.parts().filter((part) => !part.finished));

  constructor() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const value: unknown = JSON.parse(raw);
      if (!this.isSavedState(value)) throw new Error('Invalid saved state');
      this.parts.set(value.parts);
      this.savedName.set(value.name);
    } catch {
      this.storageWarning.set(
        'La sauvegarde locale est indisponible ou illisible. Vos nouvelles parts restent dans cette session.',
      );
    }
  }

  available(wirdId: string): number {
    const wird = this.wirds().find((item) => item.id === wirdId);
    if (!wird) return 0;
    return (
      wird.target -
      wird.completed -
      this.parts()
        .filter((part) => part.wirdId === wirdId)
        .reduce((total, part) => total + part.quantity, 0)
    );
  }

  completed(wirdId: string): number {
    return (
      (this.wirds().find((item) => item.id === wirdId)?.completed ?? 0) +
      this.parts()
        .filter((part) => part.wirdId === wirdId && part.finished)
        .reduce((total, part) => total + part.quantity, 0)
    );
  }

  reserve(wirdId: string, quantity: number, name: string): Part | null {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > this.available(wirdId))
      return null;
    const part: Part = {
      id: crypto.randomUUID(),
      wirdId,
      quantity,
      name: name.trim().slice(0, 60),
      finished: false,
    };
    this.parts.update((parts) => [...parts, part]);
    this.savedName.set(part.name);
    this.persist();
    return part;
  }

  finish(partId: string): boolean {
    if (!this.parts().some((part) => part.id === partId && !part.finished)) return false;
    this.parts.update((parts) =>
      parts.map((part) => (part.id === partId ? { ...part, finished: true } : part)),
    );
    this.persist();
    return true;
  }

  private persist(): void {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ parts: this.parts(), name: this.savedName() }),
      );
    } catch {
      this.storageWarning.set(
        'Votre téléphone ne permet pas la sauvegarde. Gardez cette page ouverte pour retrouver vos parts.',
      );
    }
  }

  private isSavedState(value: unknown): value is { parts: Part[]; name: string } {
    if (
      !value ||
      typeof value !== 'object' ||
      !('parts' in value) ||
      !('name' in value) ||
      typeof value.name !== 'string' ||
      value.name.length > 60 ||
      !Array.isArray(value.parts)
    )
      return false;
    return this.hasValidParts(value.parts);
  }

  private hasValidParts(parts: unknown[]): boolean {
    const ids = new Set<string>();
    const totals = new Map<string, number>();
    return parts.every((value) => {
      if (!this.isPart(value) || ids.has(value.id)) return false;
      const wird = INITIAL_WIRDS.find((item) => item.id === value.wirdId);
      if (!wird) return false;
      ids.add(value.id);
      const total = (totals.get(wird.id) ?? 0) + value.quantity;
      totals.set(wird.id, total);
      return total <= wird.target - wird.completed;
    });
  }

  private isPart(value: unknown): value is Part {
    if (!value || typeof value !== 'object') return false;
    const part = value as Record<string, unknown>;
    return (
      typeof part['id'] === 'string' &&
      typeof part['wirdId'] === 'string' &&
      typeof part['quantity'] === 'number' &&
      Number.isSafeInteger(part['quantity']) &&
      part['quantity'] > 0 &&
      typeof part['name'] === 'string' &&
      part['name'].length <= 60 &&
      typeof part['finished'] === 'boolean'
    );
  }
}
