import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Translate } from '../../../../shared/pipes/translate';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { PaymentMethods } from '../../../../shared/components/payment-methods/payment-methods';
import { I18nService } from '../../../../core/services/i18n';
import { AppConfig } from '../../../../core/config/app-config';

@Component({
  selector: 'app-support-page',
  imports: [Translate, BackButton, PaymentMethods, ReactiveFormsModule, DecimalPipe],
  templateUrl: './support-page.html',
  styleUrl: './support-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage {
  protected readonly settings = inject(AppConfig).donations;
  protected readonly amounts = computed(() => this.settings().amounts);
  private readonly picked = signal<number | null>(null);
  /** The suggested amount closest to 1 000 F is chosen until the visitor picks one. */
  protected readonly selected = computed(() => {
    const picked = this.picked();
    const amounts = this.amounts();
    if (picked !== null && amounts.includes(picked)) return picked;
    return amounts.reduce((best, value) =>
      Math.abs(value - 1000) < Math.abs(best - 1000) ? value : best,
    );
  });
  protected readonly custom = new FormControl('', { nonNullable: true });
  private readonly customValue = toSignal(this.custom.valueChanges, { initialValue: '' });

  protected readonly amount = computed(() => {
    const typed = this.customValue().replace(/\s/g, '');
    return typed ? Number(typed) : this.selected();
  });
  protected readonly valid = computed(() => {
    const amount = this.amount();
    const { min, max } = this.settings();
    return amount !== null && Number.isSafeInteger(amount) && amount >= min && amount <= max;
  });
  private readonly i18n = inject(I18nService);

  protected format(value: number | null): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value ?? 0);
  }

  protected choose(amount: number): void {
    this.picked.set(amount);
    this.custom.setValue('');
  }
}
