import { Icon, IconName } from '../../../../shared/components/icon/icon';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import {
  CreationDraftStore,
  isScheduleValid,
  Recurrence,
  Visibility,
  todayDate,
} from '../../data-access/creation-draft';
import { CreationSteps } from '../../components/creation-steps/creation-steps';

@Component({
  selector: 'app-schedule-page',
  imports: [ReactiveFormsModule, CreationSteps, Icon],
  templateUrl: './schedule-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SchedulePage {
  protected readonly store = inject(CreationDraftStore);
  private readonly router = inject(Router);
  protected readonly today = todayDate();
  protected readonly recurrences: Recurrence[] = [
    'Une fois',
    'Tous les jours',
    'Chaque semaine',
    'Chaque vendredi',
  ];
  protected readonly visibilityOptions: { value: Visibility; title: string; icon: IconName }[] = [
    { value: 'public', title: 'Tout le monde', icon: 'users' },
    { value: 'private', title: 'Avec un code', icon: 'lock' },
  ];
  protected readonly form = new FormGroup({
    recurrence: new FormControl<Recurrence>(this.store.draft().recurrence, { nonNullable: true }),
    startDate: new FormControl(this.store.draft().startDate, { nonNullable: true }),
    endDate: new FormControl(this.store.draft().endDate, { nonNullable: true }),
    visibility: new FormControl<Visibility>(this.store.draft().visibility, { nonNullable: true }),
  });
  private readonly value = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly canContinue = computed(() => {
    const value = this.value();
    return isScheduleValid({
      recurrence: value.recurrence ?? 'Une fois',
      startDate: value.startDate ?? '',
      endDate: value.endDate ?? '',
      visibility: value.visibility ?? 'public',
    });
  });
  constructor() {
    this.form.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.store.updateSchedule(this.form.getRawValue()));
  }
  protected continue(): void {
    if (this.canContinue()) void this.router.navigate(['/creer/apercu']);
  }
}
