import { Translate } from '../../../../shared/pipes/translate';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { TasbihStore } from '../../../tasbih/data-access/tasbih-store';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Icon } from '../../../../shared/components/icon/icon';
import {
  PART_PERIODS,
  PartGroup,
  PartPeriod,
  PartPeriodFilter,
  PartStateFilter,
  groupParts,
  groupState,
  lastPartDay,
  matchesPartPeriod,
  matchesPartSearch,
  partPeriod,
  sortByState,
} from '../../data-access/part-groups';
import { dakarToday } from '../../../../core/wird-cycle';

const PERIOD_LABELS: Record<PartPeriod, string> = {
  today: 'Aujourd’hui',
  yesterday: 'Hier',
  week: 'Cette semaine',
  month: 'Ce mois-ci',
  older: 'Plus ancien',
};
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { NetworkStatus } from '../../../../core/services/network-status';
import { Router } from '@angular/router';
import { Part, WirdStore } from '../../../../core/wird-store';
import { PartCard } from '../../components/part-card/part-card';

@Component({
  selector: 'app-my-parts-page',
  imports: [Translate, RequestState, EmptyState, PartCard, ReactiveFormsModule, Icon, BottomSheet],
  templateUrl: './my-parts-page.html',
  styleUrl: './my-parts-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MyPartsPage {
  protected readonly store = inject(WirdStore);
  private readonly router = inject(Router);
  protected readonly network = inject(NetworkStatus);
  protected readonly counter = inject(TasbihStore);
  protected readonly message = signal('');
  protected readonly search = new FormControl('', { nonNullable: true });
  private readonly query = toSignal(this.search.valueChanges, { initialValue: '' });
  protected readonly state = signal<PartStateFilter>('all');
  protected readonly stateOptions: { value: PartStateFilter; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'taken', label: 'Pris' },
    { value: 'progress', label: 'En cours' },
    { value: 'done', label: 'Terminé' },
  ];
  protected readonly period = signal<PartPeriodFilter>('all');
  protected readonly periodOptions: { value: PartPeriodFilter; label: string }[] = [
    { value: 'all', label: 'Toutes' },
    { value: 'today', label: 'Aujourd’hui' },
    { value: 'week', label: 'Cette semaine' },
    { value: 'month', label: 'Ce mois-ci' },
  ];
  private readonly today = dakarToday();
  protected readonly filtered = computed(() => this.state() !== 'all' || this.period() !== 'all');
  protected readonly groups = computed(() => groupParts(this.store.wirds(), this.store.parts()));
  protected readonly visibleGroups = computed(() => {
    const progress = this.counter.progress();
    return this.groups().filter(
      (group) =>
        matchesPartSearch(group, this.query()) &&
        matchesPartPeriod(group, this.period(), this.today) &&
        (this.state() === 'all' || groupState(group, progress) === this.state()),
    );
  });
  protected readonly sections = computed(() => {
    const progress = this.counter.progress();
    const byPeriod = new Map<PartPeriod, PartGroup[]>();
    for (const group of this.visibleGroups()) {
      const period = partPeriod(group, this.today);
      byPeriod.set(period, [...(byPeriod.get(period) ?? []), group]);
    }
    return PART_PERIODS.filter((period) => byPeriod.has(period)).map((period) => ({
      period,
      label: PERIOD_LABELS[period],
      groups: sortByState(
        byPeriod
          .get(period)!
          .sort((a, b) => (lastPartDay(b) ?? '').localeCompare(lastPartDay(a) ?? '')),
        progress,
      ),
    }));
  });

  protected clearFilters(): void {
    this.search.setValue('');
    this.state.set('all');
    this.period.set('all');
  }

  protected readonly finishing = signal(false);
  constructor() {
    void this.store.refresh();
  }

  protected async finish(part: Part): Promise<void> {
    if (this.finishing()) return;
    if (!navigator.onLine) {
      this.message.set('Reconnectez-vous pour confirmer votre lecture terminée.');
      return;
    }
    this.finishing.set(true);
    try {
      if (await this.store.finishPart(part.id)) {
        this.counter.forget(part.id);
        await this.router.navigate(['/merci', part.wirdId]);
      }
    } catch {
      this.message.set('La confirmation a échoué. Réessayez.');
    } finally {
      this.finishing.set(false);
    }
  }
}
