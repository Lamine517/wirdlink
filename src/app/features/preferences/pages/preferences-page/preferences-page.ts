import { I18nService } from '../../../../core/services/i18n';
import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import { Appearance, ThemePreference } from '../../../../core/services/appearance';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeviceInstall } from '../../../../core/services/device-install';

@Component({
  selector: 'app-preferences-page',
  imports: [Translate, Icon, BackButton, RouterLink],
  templateUrl: './preferences-page.html',
  styles: `
    :host {
      display: block;
    }
    .preferences-card {
      margin-bottom: 24px;
    }
    .preferences-card h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 1.125rem;
    }
    .preferences-card p {
      font-size: var(--font-size-small);
    }
    .preferences-link {
      display: flex;
      align-items: center;
      min-height: 48px;
      font-weight: 800;
    }
    .appearance-options {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(min(100%, 6rem), 1fr));
      gap: 8px;
    }
    .appearance-options .button {
      overflow-wrap: normal;
      padding-inline: 4px;
      min-width: 0;
    }
    .preferences-status {
      color: var(--color-primary);
      font-weight: 800;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesPage {
  protected readonly i18n = inject(I18nService);
  protected readonly appearance = inject(Appearance);
  protected readonly themes: { value: ThemePreference; label: string }[] = [
    { value: 'auto', label: 'Automatique' },
    { value: 'light', label: 'Clair' },
    { value: 'dark', label: 'Sombre' },
  ];
  protected readonly install = inject(DeviceInstall);
  protected readonly ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
}
