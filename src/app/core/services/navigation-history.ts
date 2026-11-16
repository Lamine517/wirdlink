import { Location } from '@angular/common';
import { Injectable, inject, signal } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

const HISTORY_DEPTH = '__wirdlinkDepth';
function readDepth(state: unknown): number {
  if (!state || typeof state !== 'object') return 0;
  const depth = (state as Record<string, unknown>)[HISTORY_DEPTH];
  return typeof depth === 'number' && Number.isSafeInteger(depth) && depth >= 0 ? depth : 0;
}

@Injectable({ providedIn: 'root' })
export class NavigationHistory {
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private depth = readDepth(this.location.getState());
  private pendingDepth = this.depth;
  private initialized = false;
  private readonly pending = signal(false);
  readonly goingBack = this.pending.asReadonly();

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        const extras = this.router.getCurrentNavigation()?.extras;
        if (event.navigationTrigger === 'popstate')
          this.pendingDepth = readDepth(event.restoredState);
        else if (!this.initialized || extras?.replaceUrl || extras?.skipLocationChange)
          this.pendingDepth = this.depth;
        else this.pendingDepth = this.depth + 1;
      } else if (event instanceof NavigationEnd) {
        this.initialized = true;
        this.depth = this.pendingDepth;
        const state = this.location.getState();
        // Preserve Angular's navigationId. No URLs, codes or personal data are recorded.
        this.location.replaceState(this.location.path(true), '', {
          ...(state && typeof state === 'object' ? state : {}),
          [HISTORY_DEPTH]: this.depth,
        });
        this.pending.set(false);
      } else if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.pending.set(false);
      }
    });
  }

  back(fallback = '/'): void {
    if (this.pending()) return;
    this.pending.set(true);
    if (this.depth > 0) {
      this.location.back();
      return;
    }
    // A direct link must not send someone out of the application.
    const target = fallback.startsWith('/') && !fallback.startsWith('//') ? fallback : '/';
    void this.router
      .navigateByUrl(target, { replaceUrl: true })
      .finally(() => this.pending.set(false));
  }
}
