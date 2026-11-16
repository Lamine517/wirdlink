import { WirdHeader } from '../../components/wird-header/wird-header';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { WirdTabs } from '../../components/wird-tabs/wird-tabs';
import { NetworkStatus } from '../../../../core/services/network-status';
import { WirdAccess } from '../../../access/data-access/wird-access';
import { CircularProgress } from '../../../../shared/components/circular-progress/circular-progress';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FRONTEND_GATEWAY, WirdAuthor } from '../../../../core/services/frontend-gateway';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { QuantityPicker } from '../../components/quantity-picker/quantity-picker';

@Component({
  selector: 'app-participate-page',
  imports: [
    BackButton,
    WirdHeader,
    ReactiveFormsModule,
    DecimalPipe,
    QuantityPicker,
    CircularProgress,
    WirdTabs,
    EmptyState,
  ],
  templateUrl: './participate-page.html',
  styleUrl: './participate-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipatePage {
  protected readonly shareOrigin = window.location.origin;
  private readonly gateway = inject(FRONTEND_GATEWAY);
  protected readonly author = signal<WirdAuthor | null>(null);
  protected readonly store = inject(WirdStore);
  protected readonly network = inject(NetworkStatus);
  private readonly access = inject(WirdAccess);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly selected = computed(() =>
    this.store
      .wirds()
      .find((wird) => wird.id === this.params().get('id') && this.access.canRead(wird.id)),
  );
  protected readonly useName = signal(false);
  protected readonly message = signal('');
  private readonly reserved = signal(false);
  protected readonly quantity = new FormControl<number | null>(null, [
    Validators.required,
    Validators.min(1),
  ]);
  protected readonly name = new FormControl(this.store.savedName(), {
    nonNullable: true,
    validators: [Validators.maxLength(60)],
  });
  protected readonly form = new FormGroup({ quantity: this.quantity, name: this.name });
  private readonly formValue = toSignal(this.form.valueChanges, {
    initialValue: this.form.getRawValue(),
  });
  protected readonly nameTouched = signal(false);
  protected readonly canReserve = computed(() => {
    const value = this.formValue();
    const wird = this.selected();
    const quantity = value.quantity;
    const name = value.name?.trim() ?? '';
    return (
      !this.reserved() &&
      this.network.online() &&
      !!wird &&
      typeof quantity === 'number' &&
      Number.isSafeInteger(quantity) &&
      quantity >= 1 &&
      quantity <= this.store.available(wird.id) &&
      (!this.useName() || (name.length > 0 && this.name.valid))
    );
  });
  protected readonly nameError = computed(() => {
    const name = this.formValue().name?.trim() ?? '';
    return this.useName() && this.nameTouched() && (name.length === 0 || this.name.invalid);
  });
  protected readonly guidance = computed(() => {
    const value = this.formValue().quantity;
    const wird = this.selected();
    if (!this.network.online()) return 'Reconnectez-vous pour commencer une part.';
    if (!wird || this.store.available(wird.id) === 0)
      return 'Toutes les parts sont prises pour le moment.';
    if (
      typeof value !== 'number' ||
      !Number.isSafeInteger(value) ||
      value < 1 ||
      value > this.store.available(wird.id)
    ) {
      return 'Choisissez une quantité disponible pour activer « Je commence ».';
    }
    return 'Écrivez votre nom ou choisissez « Sans nom » pour continuer.';
  });

  constructor() {
    effect((onCleanup) => {
      const id = this.selected()?.id;
      this.author.set(null);
      if (!id || !/^[0-9a-f]{8}-[0-9a-f-]{27}$/i.test(id)) return;
      let active = true;
      onCleanup(() => {
        active = false;
      });
      void this.gateway
        .loadWirdAuthor(id)
        .then((author) => {
          if (active) this.author.set(author);
        })
        .catch(() => undefined);
    });
  }

  protected reserve(): void {
    const wird = this.selected();
    if (!wird || this.reserved()) return;
    this.message.set('');
    if (!this.network.online() || !navigator.onLine) {
      this.message.set('Reconnectez-vous pour commencer une nouvelle part.');
      return;
    }
    if (!this.canReserve()) {
      this.nameTouched.set(true);
      this.message.set(
        this.useName() && (!this.name.value.trim() || this.name.invalid)
          ? 'Écrivez votre nom (60 caractères maximum), ou choisissez Sans nom.'
          : `Choisissez un nombre entier entre 1 et ${this.store.available(wird.id)}.`,
      );
      return;
    }
    this.reserved.set(true);
    const part = this.store.reserve(
      wird.id,
      this.quantity.value ?? 0,
      this.useName() ? this.name.value : '',
    );
    if (!part) {
      this.reserved.set(false);
      this.message.set(`Choisissez un nombre entier entre 1 et ${this.store.available(wird.id)}.`);
      return;
    }
    void this.router.navigate(['/mes-parts']).catch(() => {
      this.message.set('Votre part est réservée. Retrouvez-la dans Mes parts.');
    });
  }
}
