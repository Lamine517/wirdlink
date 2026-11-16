import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { CycleReminders } from '../../../core/services/cycle-reminders';
import { WirdStore } from '../../../core/wird-store';
import { dakarToday, dueReminderTitles } from '../../../core/wird-cycle';
import { Icon } from '../icon/icon';

const DISMISS_KEY = 'wirdlink.reminder.dismissed';

@Component({
  selector: 'app-cycle-reminder',
  imports: [Translate, Icon],
  template: `
    @if (visible()) {
      <section class="cycle-reminder" role="status">
        <p>
          @if (titles().length === 1) {
            {{ 'Demain, l’objectif de « {title} » recommence.' | t: { title: titles()[0] } }}
          } @else {
            {{ 'Demain, certains objectifs recommencent.' | t }}
          }
        </p>
        <button
          class="cycle-reminder__close"
          type="button"
          [attr.aria-label]="'Fermer' | t"
          (click)="dismiss()"
        >
          <app-icon name="close" [size]="18" />
        </button>
      </section>
    }
  `,
  styles: `
    .cycle-reminder {
      display: flex;
      align-items: center;
      gap: var(--space-8);
      margin-bottom: var(--space-12);
      padding: var(--space-12) var(--space-8) var(--space-12) var(--space-16);
      border-radius: var(--radius-large);
      background: var(--color-accent);
      color: var(--color-text-on-accent);
    }
    p {
      flex: 1;
      margin: 0;
      font-size: var(--font-size-small);
      font-weight: 800;
    }
    .cycle-reminder__close {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      border: 0;
      background: transparent;
      color: inherit;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CycleReminder {
  private readonly store = inject(WirdStore);
  private readonly reminders = inject(CycleReminders);
  private readonly dismissedOn = signal(readDismissed());
  protected readonly titles = computed(() =>
    dueReminderTitles(
      this.store.wirds(),
      this.store.parts().map((part) => part.wirdId),
      dakarToday(),
    ),
  );
  protected readonly visible = computed(
    () => this.titles().length > 0 && this.dismissedOn() !== dakarToday(),
  );

  constructor() {
    effect(() => {
      const titles = this.titles();
      if (titles.length > 0) this.reminders.notify(titles);
    });
  }

  protected dismiss(): void {
    const today = dakarToday();
    try {
      localStorage.setItem(DISMISS_KEY, today);
    } catch {
      /* Hiding the notice still applies to this visit. */
    }
    this.dismissedOn.set(today);
  }
}

function readDismissed(): string {
  try {
    return localStorage.getItem(DISMISS_KEY) ?? '';
  } catch {
    return '';
  }
}
