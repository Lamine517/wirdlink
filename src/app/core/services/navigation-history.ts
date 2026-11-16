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
function tabGroup(url: string): string | null {
  if (url === '/' || url === '/mes-parts' || url === '/creer') return 'main';
  const wird = url.match(/^\/wird\/([^/]+)(?:\/participants)?$/);
  return wird ? `wird:${wird[1]}` : null;
}
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
  private currentUrl = '';
  private readonly pending = signal(false);
  readonly goingBack = this.pending.asReadonly();
  readonly travel = signal<'forward' | 'back' | 'none'>('none');

  constructor() {
    this.router.events.pipe(takeUntilDestroyed()).subscribe((event) => {
      if (event instanceof NavigationStart) {
        const extras = this.router.getCurrentNavigation()?.extras;
        if (event.navigationTrigger === 'popstate')
          this.pendingDepth = readDepth(event.restoredState);
        else if (!this.initialized || extras?.replaceUrl || extras?.skipLocationChange)
          this.pendingDepth = this.depth;
        else this.pendingDepth = this.depth + 1;
        this.travel.set(this.travelFor(event));
      } else if (event instanceof NavigationEnd) {
        this.currentUrl = event.urlAfterRedirects.split(/[?#]/)[0];
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

  private travelFor(event: NavigationStart): 'forward' | 'back' | 'none' {
    const nextUrl = event.url.split(/[?#]/)[0];
    const origin = tabGroup(this.currentUrl);
    const destination = tabGroup(nextUrl);
    if (!this.initialized || (origin !== null && origin === destination)) return 'none';
    if (event.navigationTrigger === 'popstate' || this.pendingDepth < this.depth) return 'back';
    if (this.pendingDepth === this.depth) return 'none';
    return 'forward';
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
