import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-empty-state',
  imports: [RouterLink],
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyState {
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly icon = input('assets/icons/empty-hand.svg');
  readonly actionLabel = input('');
  readonly actionLink = input<string>();
  readonly actionRequested = output<void>();
}
