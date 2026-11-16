import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { DeviceInstall } from '../../../core/services/device-install';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-install-app',
  imports: [Translate, BottomSheet, Icon],
  template: `
    @if (!install.installed()) {
      <button
        class="button button--outline button--compact install-button"
        type="button"
        [disabled]="install.busy()"
        (click)="install.available() ? install.install() : instructions.open()"
      >
        <app-icon name="phone" [size]="20" />{{ 'Installer WirdLink' | t }}
      </button>
      @if (install.message()) {
        <p role="status">{{ install.message() | t }}</p>
      }
    }
    <app-bottom-sheet
      #instructions
      panelId="install-app-instructions"
      [title]="'Installer WirdLink' | t"
    >
      @if (ios) {
        <p>{{ 'Dans Safari, touchez Partager, puis « Sur l’écran d’accueil ».' | t }}</p>
      } @else {
        <p>
          {{
            'Dans le menu de votre navigateur, choisissez « Installer l’application » ou « Ajouter à l’écran d’accueil ».'
              | t
          }}
        </p>
      }
      <p>{{ 'WirdLink s’ouvrira ensuite comme une application.' | t }}</p>
      <button class="button button--primary" type="button" (click)="instructions.close()">
        {{ 'Compris' | t }}
      </button>
    </app-bottom-sheet>
  `,
  styles: `
    .install-button {
      width: 100%;
      margin-bottom: var(--space-12);
    }
    p {
      font-size: var(--font-size-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallApp {
  protected readonly install = inject(DeviceInstall);
  protected readonly ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}
