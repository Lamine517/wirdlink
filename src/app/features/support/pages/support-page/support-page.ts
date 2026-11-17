import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Translate } from '../../../../shared/pipes/translate';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { PaymentMethods } from '../../../../shared/components/payment-methods/payment-methods';
import { I18nService } from '../../../../core/services/i18n';

const MIN = 100;
const MAX = 500_000;

@Component({
  selector: 'app-support-page',
  imports: [Translate, BackButton, PaymentMethods, ReactiveFormsModule, DecimalPipe],
  templateUrl: './support-page.html',
  styleUrl: './support-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportPage {
  protected readonly amounts = [500, 1000, 2000, 5000];
  protected readonly selected = signal<number | null>(1000);
  protected readonly custom = new FormControl('', { nonNullable: true });
  private readonly customValue = toSignal(this.custom.valueChanges, { initialValue: '' });

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
}
