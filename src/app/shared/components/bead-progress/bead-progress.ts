import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  imports: [Translate],
  selector: 'app-bead-progress',
  templateUrl: './bead-progress.html',
  styleUrl: './bead-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeadProgress {
  readonly completed = input.required<number>();
  readonly target = input.required<number>();
  protected readonly beads = Array.from({ length: 10 }, (_, index) => index);
  protected readonly filled = computed(() => Math.floor((this.completed() / this.target()) * 10));
}
