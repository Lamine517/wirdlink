import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import {
  FilterChip,
  FilterChips,
} from '../../../../shared/components/filter-chips/filter-chips';
import { Wird } from '../../../../core/wird-store';

export type RecurrenceFilter = Wird['recurrence'] | 'all';
export type VisibilityFilter = 'all' | 'public' | 'private';

@Component({
  selector: 'app-wird-filters',
  imports: [Translate, Icon, BottomSheet, FilterChips],
  templateUrl: './wird-filters.html',
  styleUrl: './wird-filters.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdFilters {
  readonly recurrence = model<RecurrenceFilter>('all');
  readonly visibility = model<VisibilityFilter>('all');
  readonly resultCount = input.required<number>();
  protected readonly recurrenceOptions: { value: RecurrenceFilter; label: string }[] = [
    { value: 'Tous les jours', label: 'Chaque jour' },
    { value: 'Chaque semaine', label: 'Chaque semaine' },
    { value: 'Chaque vendredi', label: 'Chaque vendredi' },
    { value: 'Une fois', label: 'Une fois' },
  ];
  protected readonly visibilityOptions: { value: VisibilityFilter; label: string }[] = [
    { value: 'public', label: 'Tout le monde' },
    { value: 'private', label: 'Avec un code' },
  ];

  protected readonly chips = computed<FilterChip[]>(() => [
    ...this.recurrenceOptions
      .filter((option) => option.value === this.recurrence())
      .map((option) => ({ id: 'recurrence', label: option.label })),
    ...this.visibilityOptions
      .filter((option) => option.value === this.visibility())
      .map((option) => ({ id: 'visibility', label: option.label })),
  ]);

  protected remove(id: string): void {
    if (id === 'recurrence') this.recurrence.set('all');
    else this.visibility.set('all');
  }

  protected clearFilters(): void {
    this.recurrence.set('all');
    this.visibility.set('all');
  }
}
