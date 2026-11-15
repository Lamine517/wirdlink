import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Wird } from '../../../../core/wird-store';
import { BeadProgress } from '../../../../shared/components/bead-progress/bead-progress';

@Component({
  selector: 'app-wird-card',
  imports: [RouterLink, DecimalPipe, BeadProgress, AudioPlayer],
  templateUrl: './wird-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdCard {
  readonly wird = input.required<Wird>();
  readonly available = input.required<number>();
  readonly completed = input.required<number>();
  protected readonly reserved = computed(
    () => this.wird().target - this.completed() - this.available(),
  );
}
