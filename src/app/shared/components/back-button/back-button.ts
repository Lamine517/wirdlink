import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { NavigationHistory } from '../../../core/services/navigation-history';

@Component({
  selector: 'app-back-button',
  template: `<button
    type="button"
    class="back-link"
    [disabled]="navigation.goingBack()"
    (click)="navigation.back(fallback())"
  >
    <img src="assets/icons/back.svg" width="24" height="24" alt="" />Retour
  </button>`,
  styles: ':host { display:block; }',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BackButton {
  readonly fallback = input('/');
  protected readonly navigation = inject(NavigationHistory);
}
