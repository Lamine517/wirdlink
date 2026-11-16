import { Injectable, inject, signal } from '@angular/core';
import { I18nService } from './i18n';
import { dakarToday } from '../wird-cycle';

const NOTIFIED_KEY = 'wirdlink.reminder.notified';

@Injectable({ providedIn: 'root' })
export class CycleReminders {
  private readonly i18n = inject(I18nService);
  private readonly permissionState = signal<NotificationPermission | 'unsupported'>(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  );
  readonly permission = this.permissionState.asReadonly();

  async enable(): Promise<void> {
    if (typeof Notification === 'undefined') {
      this.permissionState.set('unsupported');
      return;
    }
    this.permissionState.set(await Notification.requestPermission());
  }

  notify(titles: readonly string[]): void {
    if (this.permissionState() !== 'granted' || titles.length === 0) return;
    const today = dakarToday();
    try {
      if (localStorage.getItem(NOTIFIED_KEY) === today) return;
      const body =
        titles.length === 1
          ? this.i18n.translate('Demain, l’objectif de « {title} » recommence.', {
              title: titles[0],
            })
          : this.i18n.translate('Demain, certains objectifs recommencent.');
      new Notification('WirdLink', { body });
      localStorage.setItem(NOTIFIED_KEY, today);
    } catch {
      /* The in-app reminder remains when the browser refuses the notification. */
    }
  }
}
