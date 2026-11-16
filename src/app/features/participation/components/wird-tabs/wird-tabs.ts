import { Translate } from '../../../../shared/pipes/translate';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-wird-tabs',
  imports: [Translate, RouterLink],
  template: `<nav class="wird-tabs" [attr.aria-label]="'Vues du wird' | t">
    <a
      [routerLink]="['/wird', wirdId()]"
      [class.wird-tabs__active]="active() === 'wird'"
      [attr.aria-current]="active() === 'wird' ? 'page' : null"
      >{{ 'Le wird' | t }}</a
    ><a
      [routerLink]="['/wird', wirdId(), 'participants']"
      [class.wird-tabs__active]="active() === 'participants'"
      [attr.aria-current]="active() === 'participants' ? 'page' : null"
      >{{ 'Les participants' | t }}</a
    >
  </nav>`,
  styles: `
    :host {
      display: block;
      margin: 16px 0;
    }
    .wird-tabs {
      display: flex;
      padding: 4px;
      gap: 4px;
      background: var(--color-bg-muted);
      border-radius: var(--radius-medium);
    }
    .wird-tabs a {
      flex: 1;
      display: grid;
      place-items: center;
      text-align: center;
      min-width: 0;
      min-height: 48px;
      padding: 8px;
      font-size: var(--font-size-small);
      font-weight: 800;
      border-radius: 12px;
      text-decoration: none;
      color: var(--color-text-secondary);
    }
    .wird-tabs .wird-tabs__active {
      background: var(--color-primary);
      color: var(--color-text-inverse);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdTabs {
  readonly wirdId = input.required<string>();
  readonly active = input<'wird' | 'participants'>('wird');
}
