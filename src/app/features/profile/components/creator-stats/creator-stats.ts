import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import type { CreatorStats as Stats } from '../../../../core/services/wird-repository';
import type { Wird } from '../../../../core/wird-store';
import { cycleTotals, dakarToday } from '../../../../core/wird-cycle';

@Component({
  selector: 'app-creator-stats',
  imports: [Translate, Icon, DecimalPipe, RouterLink],
  templateUrl: './creator-stats.html',
  styleUrl: './creator-stats.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreatorStats {
  readonly stats = input.required<Stats>();
  readonly wirds = input.required<readonly Wird[]>();
  private readonly today = dakarToday();

  protected readonly rows = computed(() => {
    const known = new Map(this.wirds().map((wird) => [wird.id, wird]));
    return this.stats().wirds.flatMap(({ id, days }) => {
      const wird = known.get(id);
      if (!wird) return [];
      const cycles = cycleTotals(wird, days, this.today);
      return [
        {
          id,
          title: wird.title,
          finished: days.reduce((sum, day) => sum + day.finished, 0),
          reached: cycles.filter((cycle) => cycle.finished >= wird.target).length,
          total: cycles.length,
        },
      ];
    });
  });
  protected readonly finished = computed(() =>
    this.rows().reduce((sum, row) => sum + row.finished, 0),
  );
  protected readonly reached = computed(() =>
    this.rows().reduce((sum, row) => sum + row.reached, 0),
  );
  protected readonly total = computed(() => this.rows().reduce((sum, row) => sum + row.total, 0));
}
