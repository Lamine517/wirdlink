import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-bead-progress',
  template: `
    <div
      class="beads"
      role="progressbar"
      aria-label="Lectures terminées"
      [attr.aria-valuenow]="completed()"
      [attr.aria-valuemax]="target()"
      aria-valuemin="0"
    >
      @for (bead of beads; track bead) {
        <img
          [src]="bead < filled() ? 'assets/icons/filled.svg' : 'assets/icons/empty.svg'"
          alt=""
          width="24"
          height="24"
        />
      }
    </div>
  `,
  styles: `
    .beads {
      display: flex;
      justify-content: space-between;
      gap: 0;
    }
    img {
      flex-shrink: 0;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BeadProgress {
  readonly completed = input.required<number>();
  readonly target = input.required<number>();
  protected readonly beads = Array.from({ length: 10 }, (_, index) => index);
  protected readonly filled = computed(() => Math.floor((this.completed() / this.target()) * 10));
}
