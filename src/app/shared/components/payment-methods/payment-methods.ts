import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { Translate } from '../../pipes/translate';
import { BottomSheet } from '../bottom-sheet/bottom-sheet';
import { Icon } from '../icon/icon';
import { I18nService } from '../../../core/services/i18n';
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LIST,
  PAYMENT_NUMBER,
  PAYMENT_NUMBER_LABEL,
  PaymentMethod,
} from '../../../core/payments/manual-payment';

/** Wave and Orange Money buttons that open the copy-the-number instructions. */
@Component({
  selector: 'app-payment-methods',
  imports: [DecimalPipe, Translate, BottomSheet, Icon],
  templateUrl: './payment-methods.html',
  styleUrl: './payment-methods.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentMethods {
  readonly amount = input<number | null>(null);
  readonly disabled = input(false);
  readonly panelId = input('payment');
  /** Extra instruction shown after the payment steps, already translated by the caller. */
  readonly note = input('');
  private readonly i18n = inject(I18nService);
  protected readonly methods = PAYMENT_METHOD_LIST;
  protected readonly method = signal<PaymentMethod>('wave');
  protected readonly current = computed(() => PAYMENT_METHODS[this.method()]);
  protected readonly number = PAYMENT_NUMBER_LABEL;
  protected readonly android = /android/i.test(navigator.userAgent);
  protected readonly copied = signal(false);

  protected format(value: number | null): string {
    return new Intl.NumberFormat(this.i18n.locale()).format(value ?? 0);
  }

  protected select(method: PaymentMethod, sheet: BottomSheet): void {
    this.method.set(method);
    this.copied.set(false);
    sheet.open();
  }

  protected async copyNumber(): Promise<void> {
    try {
      await navigator.clipboard.writeText(PAYMENT_NUMBER);
      this.copied.set(true);
    } catch {
      this.copied.set(false);
    }
  }
}
