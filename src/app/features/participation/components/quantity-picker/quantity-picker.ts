import { ChangeDetectionStrategy, Component, computed, effect, input, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-quantity-picker',
  imports: [ReactiveFormsModule],
  templateUrl: './quantity-picker.html',
  styleUrl: './quantity-picker.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuantityPicker {
  readonly control = input.required<FormControl<number | null>>();
  readonly maximum = input.required<number>();

  private readonly currentValue = signal<number | null>(1);
  protected readonly validationMessage = computed(() => {
    const value = this.currentValue();
    if (value === null || !Number.isSafeInteger(value) || value < 1) {
      return 'Écrivez un nombre entier supérieur ou égal à 1.';
    }
    if (value > this.maximum()) {
      return `Il ne reste que ${new Intl.NumberFormat('fr-FR').format(this.maximum())}. Écrivez un nombre plus petit.`;
    }
    return '';
  });

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      this.currentValue.set(control.value);
      const subscription = control.valueChanges.subscribe((value) => this.currentValue.set(value));
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
