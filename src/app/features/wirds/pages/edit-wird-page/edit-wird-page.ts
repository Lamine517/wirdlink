import { Translate } from '../../../../shared/pipes/translate';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { WirdStore } from '../../../../core/wird-store';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';

@Component({
  selector: 'app-edit-wird-page',
  imports: [Translate, ReactiveFormsModule, BackButton, RequestState, EmptyState],
  template: `
    <app-back-button />
    <h1>{{ 'Modifier le wird' | t }}</h1>
    @if (wird?.isOwner) {
      <form class="form-stack" [formGroup]="form" (ngSubmit)="save()">
        <label for="edit-title">{{ 'Nom du wird' | t }}</label>
        <input id="edit-title" formControlName="title" maxlength="100" required />
        <label for="edit-target">Objectif</label>
        <input
          id="edit-target"
          type="number"
          inputmode="numeric"
          formControlName="target"
          [min]="minimum"
          step="1"
          required
          aria-describedby="edit-target-hint"
        />
        <p id="edit-target-hint" class="text-secondary">
          Au moins {{ minimum }} : les parts déjà prises sont conservées.
        </p>
        <label for="edit-description">Description (facultatif)</label>
        <textarea
          id="edit-description"
          formControlName="description"
          maxlength="1000"
          rows="3"
        ></textarea>
        <label for="edit-instructions">Consignes (facultatif)</label>
        <textarea
          id="edit-instructions"
          formControlName="instructions"
          maxlength="1000"
          rows="4"
        ></textarea>
        <p class="text-secondary">
          Le calendrier, les fichiers et l’accès restent identiques pour les participants.
        </p>
        <app-request-state [error]="error()" [loading]="busy()" loadingLabel="Enregistrement…" />
        <button
          class="button button--primary"
          type="submit"
          [disabled]="form.invalid || busy() || form.pristine"
        >
          {{ 'Enregistrer' | t }}
        </button>
      </form>
    } @else {
      <app-empty-state
        title="Modification indisponible"
        description="Seul l’auteur peut modifier ce wird."
        [actionLabel]="'Retour à l’accueil' | t"
        actionLink="/"
      />
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditWirdPage {
  private readonly store = inject(WirdStore);
  private readonly router = inject(Router);
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? '';
  protected readonly wird = this.store.wirds().find((item) => item.id === this.id);
  protected readonly minimum = Math.max(
    1,
    (this.wird?.completed ?? 0) + (this.wird?.reserved ?? 0),
  );
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly form = new FormGroup({
    title: new FormControl(this.wird?.title ?? '', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    target: new FormControl(this.wird?.target ?? 1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(this.minimum), Validators.max(2147483647)],
    }),
    description: new FormControl(this.wird?.description ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
    instructions: new FormControl(this.wird?.instructions ?? '', {
      nonNullable: true,
      validators: [Validators.maxLength(1000)],
    }),
  });
  protected async save(): Promise<void> {
    if (!this.wird?.isOwner || this.busy() || this.form.invalid) return;
    const changes = this.form.getRawValue();
    if (!changes.title.trim() || !Number.isSafeInteger(changes.target)) {
      this.error.set('Vérifiez le nom et choisissez un objectif entier.');
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      await this.store.update(this.id, changes);
      await this.router.navigate(['/wird', this.id]);
    } catch {
      this.error.set(
        'Enregistrement impossible. Vérifiez votre connexion et les parts déjà prises, puis réessayez.',
      );
    } finally {
      this.busy.set(false);
    }
  }
}
