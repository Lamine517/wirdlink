import { Translate } from '../../../../shared/pipes/translate';
import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { Part } from '../../../../core/wird-store';
import { PartGroup, PartState, groupState } from '../../data-access/part-groups';
import { Icon } from '../../../../shared/components/icon/icon';

export const PART_STATE_LABELS: Record<PartState, string> = {
  taken: 'Pris',
  progress: 'En cours',
  done: 'Terminé',
};

@Component({
  selector: 'app-part-card',
  imports: [Translate, DecimalPipe, Icon, RouterLink],
  templateUrl: './part-card.html',
  styleUrl: './part-card.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PartCard {
  readonly group = input.required<PartGroup>();
  readonly disabled = input(false);
  readonly progress = input<ReadonlyMap<string, number>>(new Map());
  readonly finishRequested = output<Part>();
  protected readonly state = computed(() => groupState(this.group(), this.progress()));
  protected readonly stateLabel = computed(() => PART_STATE_LABELS[this.state()]);
}
