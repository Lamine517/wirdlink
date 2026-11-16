import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-wird-header',
  imports: [BackButton, Icon, RouterLink],
  template: `<header>
    <div class="wird-header__toolbar">
      <app-back-button />
      @if (shareLink(); as link) {
        <a
          class="wird-header__share"
          [routerLink]="link"
          aria-label="Partager ce wird"
          title="Partager ce wird"
          ><app-icon name="share" [size]="24"
        /></a>
      }
    </div>
    <h1>{{ title() }}</h1>
  </header>`,
  styles: `
    :host {
      display: block;
    }
    .wird-header__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 48px;
    }
    .wird-header__share {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 16px;
      background: var(--color-bg-muted);
      color: var(--color-primary);
    }
    h1 {
      text-align: center;
      margin: 12px 0 16px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdHeader {
  readonly title = input.required<string>();
  readonly shareLink = input<string>();
}
