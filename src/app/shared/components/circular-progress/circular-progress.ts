import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-circular-progress',
  imports: [DecimalPipe],
  templateUrl: './circular-progress.html',
  styleUrl: './circular-progress.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CircularProgress {
  readonly title = input.required<string>();
  readonly completed = input.required<number>();
  readonly target = input.required<number>();
  protected readonly progress = computed(() => {
    if (this.target() <= 0) return 0;
    return Math.min(100, Math.max(0, (this.completed() / this.target()) * 100));
  });
}
