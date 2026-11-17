import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Wird } from '../../../../core/wird-store';
import { dakarToday, displayDay, nextDay, wirdPhase } from '../../../../core/wird-cycle';
import { I18nService } from '../../../../core/services/i18n';
import { BeadProgress } from '../../../../shared/components/bead-progress/bead-progress';

@Component({
  selector: 'app-wird-card',
  imports: [Translate, Icon, RouterLink, BeadProgress, AudioPlayer],
  templateUrl: './wird-card.html',
  styles: `
    .wird-card__title {
      display: flex;
      align-items: center;
      min-height: 48px;
      color: var(--color-text-primary);
      text-decoration: none;
    }
    .wird-card__title:hover {
      color: var(--color-primary);
      text-decoration: underline;
    }
    .wird-card__reached {
      color: var(--color-primary);
      font-weight: 700;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdCard {
  readonly wird = input.required<Wird>();
  readonly available = input.required<number>();
  readonly completed = input.required<number>();
  protected readonly reserved = computed(
    () => this.wird().target - this.completed() - this.available(),
  );
  readonly today = input(dakarToday());
  private readonly i18n = inject(I18nService);
  protected readonly phase = computed(() => wirdPhase(this.wird(), this.completed(), this.today()));
  protected readonly phaseDay = computed(() => {
    const phase = this.phase();
    return 'day' in phase ? displayDay(phase.day, this.i18n.locale()) : '';
  });
  protected readonly isTomorrow = computed(() => {
    const phase = this.phase();
    return 'day' in phase && phase.day === nextDay(this.today());
  });
}
