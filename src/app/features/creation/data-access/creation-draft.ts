import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type Recurrence = 'Une fois' | 'Tous les jours' | 'Chaque semaine' | 'Chaque vendredi';
export type Visibility = 'public' | 'private';
export interface DraftContent {
  title: string;
  description: string;
  instructions?: string;
  target: number | null;
}
export interface DraftSchedule {
  recurrence: Recurrence;
  startDate: string;
  endDate: string;
  visibility: Visibility;
}
export type CreationDraft = DraftContent & DraftSchedule;
export interface LocalMedia {
  file: File;
  url: string;
}
export const WIRD_TEMPLATES = [
  { id: 'salat', title: 'Salat ala Nabi', target: 1000 },
  { id: 'fatiha', title: 'Al Fatiha', target: 100 },
  { id: 'istighfar', title: 'Istighfar', target: 1000 },
  { id: 'tahlil', title: 'Tahlil', target: 1000 },
  { id: 'custom', title: 'Mon propre wird', target: null },
] as const;
const STORAGE_KEY = 'wirdlink.creation.v1';
const RECURRENCES: readonly string[] = [
  'Une fois',
  'Tous les jours',
  'Chaque semaine',
  'Chaque vendredi',
];

export function todayDate(): string {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}
function isDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}
export function isContentValid(draft: DraftContent): boolean {
  return (
    draft.title.trim().length > 0 &&
    draft.title.length <= 100 &&
    draft.description.length <= 1000 &&
    (draft.instructions ?? '').length <= 1000 &&
    typeof draft.target === 'number' &&
    Number.isSafeInteger(draft.target) &&
    draft.target > 0
  );
}
export function isScheduleValid(draft: DraftSchedule): boolean {
  return (
    RECURRENCES.includes(draft.recurrence) &&
    ['public', 'private'].includes(draft.visibility) &&
    isDate(draft.startDate) &&
    draft.startDate >= todayDate() &&
    (draft.endDate === '' || (isDate(draft.endDate) && draft.endDate >= draft.startDate))
  );
}
function emptyDraft(): CreationDraft {
  return {
    title: '',
    description: '',
    instructions: '',
    target: null,
    recurrence: 'Une fois',
    startDate: todayDate(),
    endDate: '',
    visibility: 'public',
  };
}
function isStoredDraft(value: unknown): value is CreationDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Record<string, unknown>;
  return (
    typeof draft['title'] === 'string' &&
    draft['title'].length <= 100 &&
    typeof draft['description'] === 'string' &&
    draft['description'].length <= 1000 &&
    (draft['instructions'] === undefined ||
      (typeof draft['instructions'] === 'string' && draft['instructions'].length <= 1000)) &&
    (draft['target'] === null ||
      (typeof draft['target'] === 'number' && Number.isFinite(draft['target']))) &&
    typeof draft['recurrence'] === 'string' &&
    RECURRENCES.includes(draft['recurrence']) &&
    typeof draft['startDate'] === 'string' &&
    draft['startDate'].length <= 10 &&
    typeof draft['endDate'] === 'string' &&
    draft['endDate'].length <= 10 &&
    (draft['visibility'] === 'public' || draft['visibility'] === 'private')
  );
}

@Injectable({ providedIn: 'root' })
export class CreationDraftStore {
  private readonly state = signal<CreationDraft>(emptyDraft());
  readonly draft = this.state.asReadonly();
  readonly image = signal<LocalMedia | null>(null);
  readonly audio = signal<LocalMedia | null>(null);
  readonly warning = signal('');
  readonly mediaError = signal('');
  readonly hasDraft = computed(() =>
    Boolean(
      this.draft().title ||
        this.draft().target !== null ||
        this.draft().description ||
        this.draft().instructions ||
        this.image() ||
        this.audio(),
    ),
  );
  readonly contentValid = computed(() => isContentValid(this.draft()));
  readonly scheduleValid = computed(() => isScheduleValid(this.draft()));

  constructor() {
    inject(DestroyRef).onDestroy(() => this.releaseMedia());
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (!isStoredDraft(parsed)) throw new Error('Invalid draft');
        this.state.set({ ...emptyDraft(), ...parsed });
      }
    } catch {
      this.warning.set('Le brouillon n’a pas pu être restauré. Vous pouvez en créer un nouveau.');
    }
  }

  chooseTemplate(template: (typeof WIRD_TEMPLATES)[number]): void {
    this.releaseMedia();
    this.state.set({
      ...emptyDraft(),
      title: template.id === 'custom' ? '' : template.title,
      target: template.target,
    });
    this.persist();
  }

  discard(): void {
    this.releaseMedia();
    this.state.set(emptyDraft());
    this.mediaError.set('');
    this.warning.set('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.draft()));
      } catch {
        this.warning.set(
          'Suppression locale indisponible. Le brouillon peut réapparaître au prochain démarrage.',
        );
      }
    }
  }

  updateContent(content: DraftContent): void {
    this.state.update((draft) => ({ ...draft, ...content }));
    this.persist();
  }
  updateSchedule(schedule: DraftSchedule): void {
    this.state.update((draft) => ({ ...draft, ...schedule }));
    this.persist();
  }

  setMedia(kind: 'image' | 'audio', file: File): boolean {
    this.mediaError.set('');
    const validType =
      kind === 'image'
        ? ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
        : file.type.startsWith('audio/');
    if (!validType || file.size === 0 || file.size > 10 * 1024 * 1024) {
      this.mediaError.set(
        kind === 'image'
          ? 'Choisissez une photo JPEG, PNG ou WebP de 10 Mo maximum.'
          : 'Choisissez un fichier audio de 10 Mo maximum.',
      );
      return false;
    }
    this.removeMedia(kind);
    this[kind].set({ file, url: URL.createObjectURL(file) });
    return true;
  }

  removeMedia(kind: 'image' | 'audio'): void {
    const media = this[kind]();
    if (media) URL.revokeObjectURL(media.url);
    this[kind].set(null);
  }

  private releaseMedia(): void {
    this.removeMedia('image');
    this.removeMedia('audio');
  }
  private persist(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.draft()));
    } catch {
      this.warning.set('La sauvegarde locale est indisponible. Gardez cette page ouverte.');
    }
  }
}
