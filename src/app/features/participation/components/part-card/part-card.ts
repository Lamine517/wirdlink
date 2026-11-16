import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Part } from '../../../../core/wird-store';
import { PartGroup } from '../../data-access/part-groups';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-part-card',
  imports: [DecimalPipe, Icon],
  templateUrl: './part-card.html',
  styleUrl: './part-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartCard {
  readonly group = input.required<PartGroup>();
  readonly disabled = input(false);
  readonly finishRequested = output<Part>();
}
