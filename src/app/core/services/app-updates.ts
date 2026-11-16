import { DOCUMENT } from '@angular/common';
import { ApplicationRef, DestroyRef, Injectable, InjectionToken, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SwUpdate } from '@angular/service-worker';
import { filter, take } from 'rxjs';

export const APP_RELOAD = new InjectionToken<() => void>('APP_RELOAD', {
  providedIn: 'root',
  factory: () => {
    const document = inject(DOCUMENT);
    return () => document.defaultView?.location.reload();
  },
});

const CHECK_INTERVAL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class AppUpdates {
  private readonly updates = inject(SwUpdate, { optional: true });
  private readonly app = inject(ApplicationRef);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reloadPage = inject(APP_RELOAD);
  private readonly updateAvailable = signal(false);
  private readonly recoveryRequired = signal(false);
  private readonly reloadPending = signal(false);
  readonly available = this.updateAvailable.asReadonly();
  readonly unrecoverable = this.recoveryRequired.asReadonly();
  readonly reloading = this.reloadPending.asReadonly();
  private stable = false;
  private checking = false;
  private lastCheckAt: number | null = null;

  constructor() {
    const updates = this.updates;
    const window = this.document.defaultView;
    if (!updates?.isEnabled || !window) return;

    updates.versionUpdates.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
      if (event.type === 'VERSION_READY') this.updateAvailable.set(true);
    });
    updates.unrecoverable.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.recoveryRequired.set(true);
      this.updateAvailable.set(true);
    });

    const check = () => void this.checkForUpdate();
    window.addEventListener('focus', check);
    window.addEventListener('online', check);
    this.destroyRef.onDestroy(() => {
      window.removeEventListener('focus', check);
      window.removeEventListener('online', check);
    });
    this.app.isStable.pipe(filter(Boolean), take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.stable = true;
      check();
    });
  }

  async checkForUpdate(): Promise<void> {
    const window = this.document.defaultView;
    if (!this.stable || !this.updates?.isEnabled || !window?.navigator.onLine || this.checking || this.destroyRef.destroyed) return;
    const now = Date.now();
    if (this.lastCheckAt !== null && now - this.lastCheckAt < CHECK_INTERVAL_MS) return;
    this.checking = true;
    this.lastCheckAt = now;
    try {
      await this.updates.checkForUpdate();
    } catch {
      // Keep the current app usable; a later focus or reconnection retries the check.
    } finally {
      this.checking = false;
    }
  }

  reload(): void {
    if (!this.available() || this.reloading()) return;
    this.reloadPending.set(true);
    try {
      // A full reload switches bundles together; never activate a version in-place.
      this.reloadPage();
    } catch {
      this.reloadPending.set(false);
    }
  }
}
