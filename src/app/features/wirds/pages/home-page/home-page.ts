import { RouterLink } from '@angular/router';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { WirdStore } from '../../../../core/wird-store';
import { SpeechReader } from '../../../../core/speech-reader';
import { WirdCard } from '../../components/wird-card/wird-card';
import {
  VisibilityFilter,
  RecurrenceFilter,
  WirdFilters,
  WirdStatus,
} from '../../components/wird-filters/wird-filters';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, EmptyState, WirdCard, WirdFilters],
  providers: [SpeechReader],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePage {
  protected readonly store = inject(WirdStore);
  protected readonly reader = inject(SpeechReader);
  protected readonly visibility = signal<VisibilityFilter>('all');
  protected readonly status = signal<WirdStatus>('active');
  protected readonly recurrence = signal<RecurrenceFilter>('all');
  protected readonly visibleWirds = computed(() =>
    this.store.wirds().filter((wird) => {
      const finished = this.store.completed(wird.id) >= wird.target;
      const matchesStatus =
        this.status() === 'all' || (this.status() === 'finished' ? finished : !finished);
      return (
        matchesStatus &&
        (this.recurrence() === 'all' || wird.recurrence === this.recurrence()) &&
        (this.visibility() === 'all' || wird.visibility === this.visibility())
      );
    }),
  );

  protected resetFilters(): void {
    this.visibility.set('all');
    this.status.set('active');
    this.recurrence.set('all');
  }

  protected readHelp(): void {
    this.reader.read(
      'Bienvenue sur WirdLink. Choisissez un wird, puis Je participe. Vos parts sont disponibles dans Mes parts.',
    );
  }
}
