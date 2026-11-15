import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-creation-steps',
  imports: [RouterLink],
  templateUrl: './creation-steps.html',
  styleUrl: './creation-steps.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreationSteps {
  readonly step = input.required<1 | 2 | 3>();
  readonly backLink = input.required<string>();
}
