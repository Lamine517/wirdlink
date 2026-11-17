import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { Translate } from '../../../../shared/pipes/translate';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { Icon } from '../../../../shared/components/icon/icon';
import { SUPABASE_CONFIG } from '../../../../core/supabase/supabase-client';
import { NetworkStatus } from '../../../../core/services/network-status';
import { I18nService } from '../../../../core/services/i18n';

const MIN = 100;
const MAX = 500_000;
const ORANGE_NUMBER = '765578379';

@Component({
  selector: 'app-support-page',
  imports: [Translate, BackButton, BottomSheet, Icon, ReactiveFormsModule, DecimalPipe],
  templateUrl: './support-page.html',
  styleUrl: './support-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage {
  private readonly config = inject(SUPABASE_CONFIG);
  protected readonly network = inject(NetworkStatus);
  protected readonly outcome = inject(ActivatedRoute).snapshot.queryParamMap.get('don');
  protected readonly amounts = [500, 1000, 2000, 5000];
  protected readonly selected = signal<number | null>(1000);
  protected readonly custom = new FormControl('', { nonNullable: true });
  private readonly customValue = toSignal(this.custom.valueChanges, { initialValue: '' });
  protected readonly orangeNumber = ORANGE_NUMBER.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
  protected readonly android = /android/i.test(navigator.userAgent);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly copied = signal(false);

  protected readonly amount = computed(() => {
    const typed = this.customValue().replace(/\s/g, '');
    return typed ? Number(typed) : this.selected();
  });
  protected readonly valid = computed(() => {
    const amount = this.amount();
    return amount !== null && Number.isSafeInteger(amount) && amount >= MIN && amount <= MAX;
  });
  protected readonly limits = { min: MIN, max: MAX };
  private readonly i18n = inject(I18nService);

  protected format(value: number | null): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value ?? 0);
  }

  protected choose(amount: number): void {
    this.selected.set(amount);
    this.custom.setValue('');
  }

  protected async payWithWave(): Promise<void> {
    if (!this.valid() || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const response = await fetch(this.config.url + '/functions/v1/wave-donation', {
        method: 'POST',
        headers: { apikey: this.config.publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: this.amount() }),
        signal: AbortSignal.timeout(15000),
      });
      const data: unknown = await response.json();
      const url = data && typeof data === 'object' && 'url' in data ? data.url : null;
      if (!response.ok || typeof url !== 'string' || !url.startsWith('https://pay.wave.com/'))
        throw new Error('Wave unavailable');
      window.location.assign(url);
    } catch {
      this.error.set('Wave est indisponible pour le moment. Réessayez ou choisissez Orange Money.');
      this.busy.set(false);
    }
  }

  protected async copyNumber(): Promise<void> {
    try {
      await navigator.clipboard.writeText(ORANGE_NUMBER);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
