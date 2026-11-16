import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DeviceInstall } from '../../../../core/services/device-install';
import { NetworkStatus } from '../../../../core/services/network-status';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { RequestState } from '../../../../shared/components/request-state/request-state';

@Component({
  selector: 'app-preferences-page',
  imports: [RouterLink, RequestState],
  templateUrl: './preferences-page.html',
  styles: `
    :host {
      display: block;
    }
    .preferences-card {
      margin-bottom: 24px;
    }
    .preferences-card h2 {
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
    .preferences-status {
      color: var(--color-primary);
      font-weight: 800;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PreferencesPage {
  protected readonly install = inject(DeviceInstall);
  protected readonly network = inject(NetworkStatus);
  private readonly gateway = inject(FRONTEND_GATEWAY);
  protected readonly ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
  protected readonly notificationSupport = 'Notification' in window;
  protected readonly blocked = this.notificationSupport && Notification.permission === 'denied';
  protected readonly reminders = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected async toggleReminders(): Promise<void> {
    if (this.busy() || this.blocked || !this.notificationSupport || !this.network.online()) return;
    this.busy.set(true);
    this.error.set('');
    const enabled = !this.reminders();
    try {
      await this.gateway.setReminders(enabled);
      this.reminders.set(enabled);
    } catch {
      this.error.set('Les rappels ne sont pas encore disponibles. Aucun rappel n’a été activé.');
    } finally {
      this.busy.set(false);
    }
  }
}
