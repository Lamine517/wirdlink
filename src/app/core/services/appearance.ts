import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

export type ThemePreference = 'auto' | 'light' | 'dark';
const STORAGE_KEY = 'wirdlink.theme.v1';
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'auto' || value === 'light' || value === 'dark';
}

@Injectable({ providedIn: 'root' })
export class Appearance {
  private readonly media = window.matchMedia('(prefers-color-scheme: dark)');
  private readonly systemDark = signal(this.media.matches);
  private readonly selected = signal<ThemePreference>('auto');
  readonly preference = this.selected.asReadonly();
  readonly resolved = computed(() =>
    this.selected() === 'auto' ? (this.systemDark() ? 'dark' : 'light') : this.selected(),
  );
  readonly warning = signal('');

  constructor() {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (isThemePreference(value)) this.selected.set(value);
    } catch {
      /* The system theme remains usable when storage is unavailable. */
    }
    this.apply();
    const update = (event: MediaQueryListEvent) => {
      this.systemDark.set(event.matches);
      this.apply();
    };
    this.media.addEventListener('change', update);
    inject(DestroyRef).onDestroy(() => this.media.removeEventListener('change', update));
  }

  setPreference(value: ThemePreference): void {
    if (!isThemePreference(value)) return;
    this.selected.set(value);
    this.apply();
    this.warning.set('');
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      this.warning.set(
        'Ce choix reste appliqué pour cette session, mais n’a pas pu être enregistré.',
      );
    }
  }

  private apply(): void {
    const root = document.documentElement;
    root.dataset['theme'] = this.resolved();
    root.style.colorScheme = this.resolved();
  }
}
