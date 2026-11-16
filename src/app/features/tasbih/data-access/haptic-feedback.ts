import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class HapticFeedback {
  readonly supported = typeof navigator.vibrate === 'function';
  readonly unavailable = signal(false);

  tap(): void {
    this.vibrate(12);
  }
  goal(): void {
    this.vibrate([90, 60, 140]);
  }

  private vibrate(pattern: number | number[]): void {
    if (!this.supported) return;
    try {
      if (!navigator.vibrate(pattern)) this.unavailable.set(true);
    } catch {
      this.unavailable.set(true);
    }
  }
}
