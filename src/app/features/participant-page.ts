import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WirdStore } from '../core/wird-store';
import { BeadProgress } from '../shared/bead-progress';

@Component({
  selector: 'app-participant-page',
  imports: [RouterLink, ReactiveFormsModule, DecimalPipe, BeadProgress],
  templateUrl: './participant-page.html',
  styleUrl: './participant-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ParticipantPage {
  readonly store = inject(WirdStore);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly data = toSignal(this.route.data, { initialValue: this.route.snapshot.data });
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  protected readonly view = computed(() => this.data()['view'] ?? 'home');
  protected readonly selected = computed(() =>
    this.store.wirds().find((wird) => wird.id === this.params().get('id')),
  );
  protected readonly status = signal('active');
  protected readonly recurrence = signal('all');
  protected readonly filtersOpen = signal(false);
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
  protected readonly visibleWirds = computed(() =>
    this.store
      .wirds()
      .filter(
        (wird) =>
          (this.status() === 'all' ||
            (this.status() === 'finished'
              ? this.store.completed(wird.id) >= wird.target
              : this.store.completed(wird.id) < wird.target)) &&
          (this.recurrence() === 'all' || wird.recurrence === this.recurrence()),
      ),
  );

  protected selectFilter(event: Event, filter: 'status' | 'recurrence'): void {
    const value = (event.target as HTMLSelectElement).value;
    if (filter === 'status') this.status.set(value);
    else this.recurrence.set(value);
  }

  protected setQuantity(value: number): void {
    this.quantity.setValue(value);
    this.message.set('');
  }
  protected adjust(amount: number): void {
    this.setQuantity(Math.max(1, (this.quantity.value ?? 0) + amount));
  }

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

  protected finish(id: string, wirdId: string): void {
    if (!navigator.onLine) {
      this.message.set('Reconnectez-vous pour confirmer votre lecture terminée.');
      return;
    }
    if (this.store.finish(id)) void this.router.navigate(['/merci', wirdId]);
  }

  protected listen(text: string): void {
    if (!('speechSynthesis' in window)) {
      this.message.set(
        'La lecture vocale est indisponible sur ce navigateur. Le texte reste affiché.',
      );
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'fr-FR';
    speech.onerror = () =>
      this.message.set('La lecture vocale n’a pas pu démarrer. Le texte reste affiché.');
    window.speechSynthesis.speak(speech);
  }
}
