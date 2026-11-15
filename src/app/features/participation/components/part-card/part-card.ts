import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Part } from '../../../../core/wird-store';

@Component({
  selector: 'app-part-card',
  imports: [DecimalPipe],
  templateUrl: './part-card.html',
  styleUrl: './part-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartCard {
  readonly part = input.required<Part>();
  readonly title = input.required<string>();
  readonly finishRequested = output<void>();
}
