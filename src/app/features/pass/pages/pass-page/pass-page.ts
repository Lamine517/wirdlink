import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Translate } from '../../../../shared/pipes/translate';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { Icon } from '../../../../shared/components/icon/icon';
import { PaymentMethods } from '../../../../shared/components/payment-methods/payment-methods';
import { I18nService } from '../../../../core/services/i18n';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { PassError, PassKind, PassService } from '../../../../core/pass/pass-service';

type Formula = Exclude<PassKind, 'trial'>;

export const PASS_NAMES: Record<PassKind, string> = {
  trial: 'Essai gratuit',
  month: 'Pass mois',
  year: 'Pass année',
  founder: 'Pass fondateur',
};

@Component({
  selector: 'app-pass-page',
  imports: [DecimalPipe, RouterLink, Translate, BackButton, Icon, PaymentMethods],
  templateUrl: './pass-page.html',
  styleUrl: './pass-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PassPage {
  protected readonly auth = inject(AuthFlow);
  protected readonly passes = inject(PassService);
  private readonly i18n = inject(I18nService);
  protected readonly names = PASS_NAMES;
  protected readonly settings = this.passes.settings;
  protected readonly status = this.passes.status;
  protected readonly loaded = signal(false);
  protected readonly formula = signal<Formula>('year');
  protected readonly busy = signal(false);
  protected readonly error = signal('');

  protected readonly founderOpen = computed(() => {
    const status = this.status();
    return status ? status.founder || status.foundersLeft > 0 : this.settings().founderSlots > 0;
  });
  protected readonly formulas = computed(() => {
    const settings = this.settings();
    const list: { id: Formula; price: number; period: string }[] = [
      { id: 'month', price: settings.monthPrice, period: 'par mois' },
      { id: 'year', price: settings.yearPrice, period: 'par an' },
    ];
    if (this.founderOpen()) list.push({ id: 'founder', price: settings.founderPrice, period: 'par an' });
    return list;
  });
  protected readonly price = computed(
    () => this.formulas().find((item) => item.id === this.formula())?.price ?? null,
  );
  protected readonly canTry = computed(() => {
    const status = this.status();
    return !!status && !status.hadPass && this.settings().trialDays > 0;
  });

  constructor() {
    void this.passes.loadSettings().finally(() => this.loaded.set(true));
    effect(() => {
      if (this.auth.session()) void this.passes.loadStatus();
      else this.passes.clear();
    });
  }

  protected date(value: string): string {
    return new Intl.DateTimeFormat(this.i18n.locale(), {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(value + 'T00:00:00Z'));
  }

  protected async startTrial(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.passes.startTrial();
    } catch (error) {
      this.error.set(
        error instanceof PassError && error.code === 'trial_unavailable'
          ? 'L’essai gratuit n’est plus disponible pour ce compte.'
          : 'L’essai n’a pas pu démarrer. Réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
