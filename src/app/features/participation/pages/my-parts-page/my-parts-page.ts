import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Icon } from '../../../../shared/components/icon/icon';
import { groupParts, matchesPartSearch } from '../../data-access/part-groups';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Part, WirdStore } from '../../../../core/wird-store';
import { PartCard } from '../../components/part-card/part-card';

@Component({
  selector: 'app-my-parts-page',
  imports: [EmptyState, PartCard, ReactiveFormsModule, Icon],
  templateUrl: './my-parts-page.html',
  styleUrl: './my-parts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPartsPage {
  private readonly store = inject(WirdStore);
  private readonly router = inject(Router);
  protected readonly message = signal('');
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly groups = computed(() => groupParts(this.store.wirds(), this.store.parts()));
  protected readonly visibleGroups = computed(() =>
    this.groups().filter((group) => matchesPartSearch(group, this.query())),
  );

  protected finish(part: Part): void {
    if (!navigator.onLine) {
      this.message.set('Reconnectez-vous pour confirmer votre lecture terminée.');
      return;
    }
    if (this.store.finish(part.id)) void this.router.navigate(['/merci', part.wirdId]);
  }
}
