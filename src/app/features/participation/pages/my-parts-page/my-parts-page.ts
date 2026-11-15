import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Part, WirdStore } from '../../../../core/wird-store';
import { PartCard } from '../../components/part-card/part-card';

@Component({
  selector: 'app-my-parts-page',
  imports: [EmptyState, PartCard],
  templateUrl: './my-parts-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPartsPage {
  private readonly store = inject(WirdStore);
  private readonly router = inject(Router);
  protected readonly message = signal('');
  protected readonly entries = computed(() => {
    const titles = new Map(this.store.wirds().map((wird) => [wird.id, wird.title]));
    return this.store
      .parts()
      .map((part) => ({ part, title: titles.get(part.wirdId) ?? 'Wird indisponible' }));
  });

  protected finish(part: Part): void {
    if (!navigator.onLine) {
      this.message.set('Reconnectez-vous pour confirmer votre lecture terminée.');
      return;
    }
    if (this.store.finish(part.id)) void this.router.navigate(['/merci', part.wirdId]);
  }
}
