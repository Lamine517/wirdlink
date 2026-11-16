import { Translate } from '../../../../shared/pipes/translate';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { NetworkStatus } from '../../../../core/services/network-status';
import { TasbihStore, HapticPreferences } from '../../data-access/tasbih-store';
import { HapticFeedback } from '../../data-access/haptic-feedback';
import { WirdAccess } from '../../../access/data-access/wird-access';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-tasbih-page',
  imports: [Translate, DecimalPipe, BackButton, BottomSheet, EmptyState, Icon],
  templateUrl: './tasbih-page.html',
  styleUrl: './tasbih-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TasbihPage {
  private readonly store = inject(WirdStore);
  private readonly access = inject(WirdAccess);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly counter = inject(TasbihStore);
  protected readonly vibration = inject(HapticFeedback);
  protected readonly network = inject(NetworkStatus);
  protected readonly part = computed(() =>
    this.store.parts().find((part) => part.id === this.params().get('id')),
  );
  protected readonly wird = computed(() =>
    this.store
      .wirds()
      .find((wird) => wird.id === this.part()?.wirdId && this.access.canRead(wird.id)),
  );
  protected readonly count = computed(() => this.counter.count(this.part()?.id ?? ''));
  protected readonly reached = computed(() =>
    Boolean(this.part() && this.count() >= this.part()!.quantity),
  );
  protected readonly progress = computed(() =>
    this.part() ? (this.count() / this.part()!.quantity) * 100 : 0,
  );
  protected readonly confirmReset = signal(false);
  protected readonly finishing = signal(false);
  protected readonly error = signal('');

  protected increment(): void {
    const part = this.part();
    if (!part || !this.wird() || this.finishing()) return;
    if (!this.counter.increment(part.id)) return;
    if (this.counter.count(part.id) === part.quantity && this.counter.haptics().atGoal) {
      this.vibration.goal();
    } else if (this.counter.haptics().onTap) this.vibration.tap();
  }

  protected undo(): void {
    const part = this.part();
    if (!part || !this.wird() || this.finishing()) return;
    this.counter.undo(part.id);
  }

  protected reset(sheet: BottomSheet): void {
    const part = this.part();
    if (part && this.wird() && !this.finishing()) this.counter.reset(part.id);
    this.confirmReset.set(false);
    sheet.close();
  }

  protected preventRepeat(event: KeyboardEvent): void {
    if (event.repeat && (event.key === 'Enter' || event.key === ' ')) event.preventDefault();
  }

  protected changeVibration(key: keyof HapticPreferences, event: Event): void {
    if (event.target instanceof HTMLInputElement)
      this.counter.setHapticPreference(key, event.target.checked);
  }

  protected async finish(): Promise<void> {
    const part = this.part();
    if (!part || !this.wird() || part.finished || !this.reached() || this.finishing()) return;
    if (!this.network.online() || !navigator.onLine) {
      this.error.set('Reconnectez-vous pour confirmer votre lecture terminée.');
      return;
    }
    this.finishing.set(true);
    try {
      if (!(await this.store.finishPart(part.id))) {
        this.finishing.set(false);
        return;
      }
    } catch {
      this.finishing.set(false);
      this.error.set('La confirmation a échoué. Votre compteur est conservé. Réessayez.');
      return;
    }
    this.counter.forget(part.id);
    void this.router.navigate(['/merci', part.wirdId]).catch(() => {
      this.error.set('Votre part est terminée. Retrouvez-la dans Mes parts.');
    });
  }
}
