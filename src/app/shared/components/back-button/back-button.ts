import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { NavigationHistory } from '../../../core/services/navigation-history';

@Component({
  selector: 'app-back-button',
  imports: [Icon],
  template: `<button
    type="button"
    class="back-link"
    [disabled]="navigation.goingBack()"
    (click)="navigation.back(fallback())"
  >
    <app-icon name="back" [size]="24" />Retour
  </button>`,
  styles: ':host { display:block; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButton {
  readonly fallback = input('/');
  protected readonly navigation = inject(NavigationHistory);
}
