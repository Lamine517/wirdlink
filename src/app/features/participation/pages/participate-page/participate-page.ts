import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { QuantityPicker } from '../../components/quantity-picker/quantity-picker';

@Component({
  selector: 'app-participate-page',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, QuantityPicker],
  templateUrl: './participate-page.html',
  styleUrl: './participate-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipatePage {
  protected readonly store = inject(WirdStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly selected = computed(() =>
    this.store.wirds().find((wird) => wird.id === this.params().get('id')),
  );
  protected readonly useName = signal(false);
  protected readonly message = signal('');
  protected readonly quantity = new FormControl<number | null>(1, [
    Validators.required,
    Validators.min(1),
  ]);
  protected readonly name = new FormControl(this.store.savedName(), {
    nonNullable: true,
    validators: [Validators.maxLength(60)],
  });
  protected readonly form = new FormGroup({ quantity: this.quantity, name: this.name });
  protected reserve(): void {
    const wird = this.selected();
    if (!wird) return;
    this.message.set('');
    if (!navigator.onLine) {
      this.message.set('Reconnectez-vous pour commencer une nouvelle part.');
      return;
    }
    if (this.useName() && (!this.name.value.trim() || this.name.invalid)) {
      this.message.set('Écrivez votre nom (60 caractères maximum), ou choisissez Sans nom.');
      return;
    }
    const part = this.store.reserve(
      wird.id,
      this.quantity.value ?? 0,
      this.useName() ? this.name.value : '',
    );
    if (!part) {
      this.message.set(`Choisissez un nombre entier entre 1 et ${this.store.available(wird.id)}.`);
      return;
    }
    void this.router.navigate(['/mes-parts']);
  }
}
