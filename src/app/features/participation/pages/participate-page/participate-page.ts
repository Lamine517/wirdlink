import { Translate } from '../../../../shared/pipes/translate';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { CreationDraftStore, todayDate } from '../../../creation/data-access/creation-draft';
import { viewChild } from '@angular/core';
import { AudioPlayer } from '../../../../shared/components/audio-player/audio-player';
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
import {
  FRONTEND_GATEWAY,
  GuestAccessError,
  WirdAuthor,
} from '../../../../core/services/frontend-gateway';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../../../../core/wird-store';
import { QuantityPicker } from '../../components/quantity-picker/quantity-picker';

@Component({
  selector: 'app-participate-page',
  imports: [
    Translate,
    AudioPlayer,
    BottomSheet,
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
  private readonly draft = inject(CreationDraftStore);
  private readonly deleteSheet = viewChild.required<BottomSheet>('deleteSheet');
  private readonly replaceDraftSheet = viewChild.required<BottomSheet>('replaceDraftSheet');
  protected readonly deleting = signal(false);
  protected openDelete(): void {
    this.deleteSheet().open();
  }
  protected edit(): void {
    const wird = this.selected();
    if (wird?.isOwner) void this.router.navigate(['/wird', wird.id, 'modifier']);
  }
  protected duplicate(): void {
    if (!this.selected()) return;
    if (this.draft.hasDraft()) {
      this.replaceDraftSheet().open();
      return;
    }
    this.copySelectedWird();
  }

  protected confirmDuplicate(): void {
    this.replaceDraftSheet().close();
    this.copySelectedWird();
  }

  private copySelectedWird(): void {
    const wird = this.selected();
    if (!wird) return;
    this.draft.removeMedia('image');
    this.draft.removeMedia('audio');
    this.draft.updateContent({
      title: wird.title,
      target: wird.target,
      description: wird.description ?? '',
      instructions: wird.instructions ?? '',
    });
    this.draft.updateSchedule({
      recurrence: wird.recurrence,
      startDate: todayDate(),
      endDate: '',
      visibility: wird.visibility,
    });
    this.draft.warning.set(
      'Le wird a été copié dans votre brouillon. Ajoutez à nouveau les photos et les fichiers audio si besoin.',
    );
    void this.router.navigate(['/creer/contenu']);
  }
  protected async deleteWird(): Promise<void> {
    const wird = this.selected();
    if (!wird?.isOwner || this.deleting()) return;
    this.deleting.set(true);
    this.message.set('');
    try {
      await this.store.delete(wird.id);
      this.deleteSheet().close();
      await this.router.navigate(['/']);
    } catch {
      this.message.set('Le wird n’a pas pu être supprimé. Réessayez.');
    } finally {
      this.deleting.set(false);
    }
  }
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
  protected readonly message = signal('');
  protected readonly reserved = signal(false);
  private requestId = crypto.randomUUID();
  private requestValue = '';
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
  protected readonly canReserve = computed(() => {
    const value = this.formValue();
    const wird = this.selected();
    const quantity = value.quantity;
    return (
      !this.reserved() &&
      this.network.online() &&
      !!wird &&
      typeof quantity === 'number' &&
      Number.isSafeInteger(quantity) &&
      quantity >= 1 &&
      quantity <= this.store.available(wird.id) &&
      this.name.valid
    );
  });
  protected readonly guidance = computed(() => {
    const wird = this.selected();
    if (!this.network.online()) return 'Reconnectez-vous pour commencer une part.';
    if (!wird || this.store.available(wird.id) === 0)
      return 'Toutes les parts sont prises pour le moment.';
    return 'Choisissez une quantité disponible pour activer « Je commence ».';
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

  protected async reserve(): Promise<void> {
    const wird = this.selected();
    if (!wird || this.reserved()) return;
    this.message.set('');
    if (!this.network.online() || !navigator.onLine) {
      this.message.set('Reconnectez-vous pour commencer une nouvelle part.');
      return;
    }
    if (!this.canReserve()) {
      this.message.set(`Choisissez un nombre entier entre 1 et ${this.store.available(wird.id)}.`);
      return;
    }
    this.reserved.set(true);
    const name = this.name.value.trim();
    const value = JSON.stringify([wird.id, this.quantity.value, name]);
    if (value !== this.requestValue) {
      this.requestValue = value;
      this.requestId = crypto.randomUUID();
    }
    try {
      const part = await this.store.reservePart(
        wird.id,
        this.quantity.value ?? 0,
        name,
        this.requestId,
      );
      if (!part) throw new Error('Invalid quantity');
    } catch (error) {
      this.reserved.set(false);
      this.message.set(
        error instanceof GuestAccessError
          ? 'La participation sans compte n’est pas disponible pour le moment. Réessayez plus tard.'
          : 'La part n’a pas pu être réservée. Vérifiez votre connexion et réessayez.',
      );
      return;
    }
    void this.router.navigate(['/mes-parts']).catch(() => {
      this.message.set('Votre part est réservée. Retrouvez-la dans Mes parts.');
    });
  }
}
