import { I18nService } from '../../../../core/services/i18n';
import { inject } from '@angular/core';
import { Translate } from '../../../../shared/pipes/translate';
import { Icon } from '../../../../shared/components/icon/icon';
import { suggestQuantities } from './quantity-suggestions';
import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-quantity-picker',
  imports: [Translate, Icon, ReactiveFormsModule],
  templateUrl: './quantity-picker.html',
  styleUrl: './quantity-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityPicker {
  private readonly i18n = inject(I18nService);
  readonly control = input.required<FormControl<number | null>>();
  readonly target = input.required<number>();
  protected readonly suggestions = computed(() => suggestQuantities(this.target(), this.maximum()));
  readonly maximum = input.required<number>();

  protected readonly currentValue = signal<number | null>(null);
  protected readonly hasInteracted = signal(false);
  protected readonly validationMessage = computed(() => {
    if (!this.hasInteracted()) return '';
    const value = this.currentValue();
    if (value === null || !Number.isSafeInteger(value) || value < 1) {
      return 'Écrivez un nombre entier supérieur ou égal à 1.';
    }
    if (value > this.maximum()) {
      return this.i18n.translate('Il ne reste que {count}. Écrivez un nombre plus petit.', {
        count: this.maximum(),
      });
    }
    return '';
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      this.currentValue.set(control.value);
      const subscription = control.valueChanges.subscribe((value) => {
        this.currentValue.set(value);
        this.hasInteracted.set(true);
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  protected setQuantity(value: number): void {
    this.control().setValue(value);
  }
  protected adjust(amount: number): void {
    this.setQuantity(Math.max(1, (this.control().value ?? 0) + amount));
  }
}
