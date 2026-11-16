import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { DeviceInstall } from '../../../core/services/device-install';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { Icon } from '../icon/icon';

const INSTALL_DISMISS_KEY = 'wirdlink.install.dismissed';

@Component({
  selector: 'app-install-app',
  imports: [Translate, BottomSheet, Icon],
  template: `
    @if (!install.installed() && !dismissed()) {
      <div class="install-banner">
        <button
          class="install-button"
          type="button"
          [disabled]="install.busy()"
          (click)="install.available() ? install.install() : instructions.open()"
        >
          <app-icon name="phone" [size]="20" />
          <span>{{ 'Installer WirdLink' | t }}</span>
        </button>
        <button
          class="install-dismiss"
          type="button"
          [attr.aria-label]="'Fermer l’invitation à installer' | t"
          (click)="dismiss()"
        >
          <app-icon name="close" [size]="18" />
        </button>
      </div>
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
    .install-banner {
      position: relative;
      margin-bottom: var(--space-12);
      border: 2px solid var(--color-primary);
      border-radius: var(--radius-large);
      background: var(--color-bg-surface);
      color: var(--color-primary);
    }
    .install-button {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: var(--space-8);
      width: 100%;
      min-height: 48px;
      padding: var(--space-8) 48px;
      border: 0;
      border-radius: var(--radius-large);
      background: transparent;
      color: inherit;
      font: inherit;
      font-size: var(--font-size-small);
      font-weight: 800;
    }
    .install-button:disabled {
      color: var(--color-text-secondary);
    }
    .install-dismiss {
      position: absolute;
      inset-inline-end: 0;
      top: 0;
      display: grid;
      place-items: center;
      width: 48px;
      height: 100%;
      min-height: 48px;
      border: 0;
      background: transparent;
      color: var(--color-text-secondary);
    }
    p {
      font-size: var(--font-size-small);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstallApp {
  protected readonly install = inject(DeviceInstall);
  protected readonly dismissed = signal(localStorage.getItem(INSTALL_DISMISS_KEY) === '1');
  protected readonly ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);

  protected dismiss(): void {
    localStorage.setItem(INSTALL_DISMISS_KEY, '1');
    this.dismissed.set(true);
  }
}
