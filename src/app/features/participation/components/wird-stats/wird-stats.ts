import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import { I18nService } from '../../../../core/services/i18n';
import type { WirdStats as Stats } from '../../../../core/services/wird-repository';
import type { Wird } from '../../../../core/wird-store';
import { cycleTotals, dakarToday } from '../../../../core/wird-cycle';

const SHOWN_CYCLES = 7;

@Component({
  selector: 'app-wird-stats',
  imports: [Translate, Icon, DecimalPipe],
  templateUrl: './wird-stats.html',
  styleUrl: './wird-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdStats {
  private readonly i18n = inject(I18nService);
  readonly wird = input.required<Wird>();
  readonly stats = input.required<Stats>();
  private readonly today = dakarToday();

  protected readonly finished = computed(() =>
    this.stats().days.reduce((sum, day) => sum + day.finished, 0),
  );
  private readonly cycles = computed(() =>
    this.wird().recurrence === 'Une fois'
      ? []
      : cycleTotals(this.wird(), this.stats().days, this.today),
  );
  protected readonly reached = computed(
    () => this.cycles().filter((cycle) => cycle.finished >= this.wird().target).length,
  );
  protected readonly total = computed(() => this.cycles().length);
  protected readonly recent = computed(() => {
    const target = this.wird().target;
    const format = new Intl.DateTimeFormat(this.i18n.locale(), {
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    return this.cycles()
      .slice(-SHOWN_CYCLES)
      .reverse()
      .map((cycle) => ({
        ...cycle,
        label: format.format(new Date(cycle.start + 'T00:00:00Z')),
        percent: Math.min(100, Math.round((cycle.finished / target) * 100)),
        reached: cycle.finished >= target,
      }));
  });
}
