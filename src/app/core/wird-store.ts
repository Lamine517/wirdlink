import {
  WIRD_REPOSITORY,
  WirdRepository,
  WirdChanges,
  WirdStats,
} from './services/wird-repository';
import { countsInCurrentCycle, dakarToday } from './wird-cycle';
import {
  computed,
  Inject,
  Injectable,
  InjectionToken,
  Optional,
  DestroyRef,
  signal,
} from '@angular/core';

export interface Wird {
  isOwner?: boolean;
  imageUrl?: string;
  reserved?: number;
  startDate?: string;
  endDate?: string;
  audioUrl?: string;
  description?: string;
  instructions?: string;
  id: string;
  title: string;
  recurrence: 'Chaque vendredi' | 'Tous les jours' | 'Chaque semaine' | 'Une fois';
  visibility: 'public' | 'private';
  target: number;
  completed: number;
}
export interface Part {
  id: string;
  wirdId: string;
  quantity: number;
  name: string;
  finished: boolean;
  createdAt?: string;
}
export const WIRD_SEED = new InjectionToken<Wird[]>('WIRD_SEED', {
  providedIn: 'root',
  factory: () => [],
});
const STORAGE_KEY = 'wirdlink.parts.v1';

@Injectable({ providedIn: 'root' })
export class WirdStore {
  readonly wirds = signal<Wird[]>([]);
  readonly parts = signal<Part[]>([]);
  readonly savedName = signal('');
  readonly storageWarning = signal('');
  readonly activeParts = computed(() => this.parts().filter((part) => !part.finished));

  readonly loading = signal(false);
  readonly error = signal('');
  readonly remote: boolean;
  readonly ready: Promise<void>;
  private refreshTask: Promise<void> | null = null;
  private generation = 0;
  private revision = 0;

  constructor(
    @Inject(WIRD_SEED) private readonly initialWirds: Wird[] = [],
    @Optional() @Inject(WIRD_REPOSITORY) private readonly repository: WirdRepository | null = null,
    @Optional() destroyRef: DestroyRef | null = null,
  ) {
    this.remote = !!repository && initialWirds.length === 0;
    this.ready = this.remote ? this.refresh() : Promise.resolve();
    if (this.remote) {
      let lastIdentity: string | null | undefined;
      const stop = repository?.watchIdentity?.((identity) => {
        if (identity === lastIdentity) return;
        lastIdentity = identity;
        this.generation++;
        this.refreshTask = null;
        this.wirds.set([]);
        this.parts.set([]);
        this.savedName.set('');
        // Auth callbacks must not await another SDK call while its session lock is held.
        queueMicrotask(() => {
          void this.refresh();
        });
      });
      if (stop) destroyRef?.onDestroy(stop);
      return;
    }
    this.wirds.set(initialWirds.map((wird) => ({ ...wird })));
    try {
      if (localStorage.getItem('wirdlink.demo.v1')) {
        localStorage.removeItem('wirdlink.demo.v1');
        localStorage.removeItem('wirdlink.tasbih.v1');
      }
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
    if (this.remote) return Math.max(0, wird.target - wird.completed - (wird.reserved ?? 0));
    return (
      wird.target -
      wird.completed -
      this.parts()
        .filter((part) => part.wirdId === wirdId)
        .reduce((total, part) => total + part.quantity, 0)
    );
  }

  completed(wirdId: string): number {
    if (this.remote) return this.wirds().find((item) => item.id === wirdId)?.completed ?? 0;
    return (
      (this.wirds().find((item) => item.id === wirdId)?.completed ?? 0) +
      this.parts()
        .filter((part) => part.wirdId === wirdId && part.finished)
        .reduce((total, part) => total + part.quantity, 0)
    );
  }

  reserve(wirdId: string, quantity: number, name: string): Part | null {
    if (this.remote) return null;
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > this.available(wirdId))
      return null;
    const part: Part = {
      id: crypto.randomUUID(),
      wirdId,
      quantity,
      name: name.trim().slice(0, 60),
      finished: false,
      createdAt: new Date().toISOString(),
    };
    this.parts.update((parts) => [...parts, part]);
    this.savedName.set(part.name);
    this.persist();
    return part;
  }

  finish(partId: string): boolean {
    if (this.remote) return false;
    if (!this.parts().some((part) => part.id === partId && !part.finished)) return false;
    this.parts.update((parts) =>
      parts.map((part) => (part.id === partId ? { ...part, finished: true } : part)),
    );
    this.persist();
    return true;
  }

  refresh(): Promise<void> {
    if (!this.remote || !this.repository) return Promise.resolve();
    if (this.refreshTask) return this.refreshTask;
    if (this.wirds().length === 0) this.loading.set(true);
    this.error.set('');
    const repository = this.repository;
    const generation = this.generation;
    const revision = this.revision;
    this.refreshTask = (async () => {
      try {
        const identity = await repository.identity();
        const [wirds, parts] = await Promise.all([repository.listWirds(), repository.listParts()]);
        if (
          identity !== (await repository.identity()) ||
          generation !== this.generation ||
          revision !== this.revision
        )
          return;
        const missingIds = [...new Set(parts.map((part) => part.wirdId))].filter(
          (id) => !wirds.some((wird) => wird.id === id),
        );
        const missing = await Promise.all(missingIds.map((id) => repository.getWird(id)));
        if (
          identity !== (await repository.identity()) ||
          generation !== this.generation ||
          revision !== this.revision
        )
          return;
        const loaded = [...wirds, ...missing.filter((wird): wird is Wird => !!wird)];
        const today = dakarToday();
        this.wirds.set(loaded);
        this.parts.set(
          parts.filter((part) =>
            countsInCurrentCycle(
              loaded.find((wird) => wird.id === part.wirdId),
              part.createdAt,
              today,
            ),
          ),
        );
      } catch {
        if (generation === this.generation)
          this.error.set('Impossible de charger les wirds. Réessayez.');
      } finally {
        if (generation === this.generation) {
          this.loading.set(false);
          this.refreshTask = null;
        }
      }
    })();
    return this.refreshTask;
  }

  async ensure(id: string): Promise<Wird | null> {
    if (!this.remote || !this.repository)
      return this.wirds().find((wird) => wird.id === id) ?? null;
    // A read that straddles the startup session is retried; an account switch still drops it.
    for (let attempt = 0; attempt < 3; attempt++) {
      const generation = this.generation;
      const revision = this.revision;
      const identity = await this.repository.identity();
      const wird = await this.repository.getWird(id);
      const current = await this.repository.identity();
      if (identity !== null && current !== identity) return null;
      if (generation !== this.generation || current !== identity) continue;
      if (revision !== this.revision && this.wirds().some((item) => item.id === id))
        return this.wirds().find((item) => item.id === id) ?? null;
      if (wird) {
        this.revision++;
        this.upsert(wird);
      } else this.wirds.update((items) => items.filter((item) => item.id !== id));
      return wird;
    }
    return null;
  }

  async reservePart(
    id: string,
    quantity: number,
    name: string,
    requestId: string,
  ): Promise<Part | null> {
    if (!this.remote || !this.repository) return this.reserve(id, quantity, name);
    const generation = this.generation;
    const identity = await this.repository.identity();
    const result = await this.repository.reserve(id, quantity, name, requestId);
    // A first guest reservation can create an anonymous session. A session switch is rejected.
    if (
      identity &&
      (generation !== this.generation || identity !== (await this.repository.identity()))
    )
      throw new Error('Session changed');
    this.revision++;
    this.upsert(result.wird);
    this.parts.update((parts) => [
      ...parts.filter((part) => part.id !== result.part.id),
      result.part,
    ]);
    this.savedName.set(result.part.name);
    return result.part;
  }

  async finishPart(id: string): Promise<boolean> {
    if (!this.remote || !this.repository) return this.finish(id);
    const generation = this.generation;
    const identity = await this.repository.identity();
    const result = await this.repository.finish(id);
    if (generation !== this.generation || identity !== (await this.repository.identity()))
      throw new Error('Session changed');
    this.revision++;
    this.upsert(result.wird);
    this.parts.update((parts) => parts.map((part) => (part.id === id ? result.part : part)));
    return true;
  }

  async stats(id: string): Promise<WirdStats | null> {
    if (!this.remote || !this.repository?.stats) return null;
    const generation = this.generation;
    const identity = await this.repository.identity();
    const stats = await this.repository.stats(id);
    return generation === this.generation && identity === (await this.repository.identity())
      ? stats
      : null;
  }

  async participants(id: string): Promise<Part[]> {
    if (!this.remote || !this.repository) return this.parts().filter((part) => part.wirdId === id);
    const generation = this.generation;
    const identity = await this.repository.identity();
    const parts = await this.repository.listParticipants(id);
    return generation === this.generation && identity === (await this.repository.identity())
      ? parts
      : [];
  }

  async unlock(id: string, code: string): Promise<Wird> {
    if (!this.repository) throw new Error('Repository unavailable');
    const generation = this.generation;
    const identity = await this.repository.identity();
    const wird = await this.repository.unlock(id, code);
    if (
      identity &&
      (generation !== this.generation || identity !== (await this.repository.identity()))
    )
      throw new Error('Session changed');
    this.revision++;
    this.upsert(wird);
    return wird;
  }

  async update(id: string, changes: WirdChanges): Promise<void> {
    if (!this.repository) throw new Error('Repository unavailable');
    const identity = await this.repository.identity();
    const generation = this.generation;
    const wird = await this.repository.update(id, changes);
    if (generation !== this.generation || identity !== (await this.repository.identity()))
      throw new Error('Session changed');
    this.revision++;
    this.upsert(wird);
  }

  async delete(id: string): Promise<void> {
    if (!this.repository) throw new Error('Repository unavailable');
    const identity = await this.repository.identity();
    const generation = this.generation;
    await this.repository.delete(id);
    if (generation !== this.generation || identity !== (await this.repository.identity())) return;
    this.revision++;
    this.wirds.update((items) => items.filter((wird) => wird.id !== id));
    this.parts.update((items) => items.filter((part) => part.wirdId !== id));
  }

  private upsert(wird: Wird): void {
    this.wirds.update((items) => [...items.filter((item) => item.id !== wird.id), wird]);
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
      const wird = this.initialWirds.find((item) => item.id === value.wirdId);
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
