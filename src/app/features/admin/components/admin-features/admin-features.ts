import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import { AppConfig } from '../../../../core/config/app-config';
import { AdminApi } from '../../data-access/admin-api';

@Component({
  selector: 'app-admin-features',
  imports: [ReactiveFormsModule, Icon],
  template: `<form class="form-stack" [formGroup]="form" (ngSubmit)="save()">
    <section class="surface-card">
      <h2>Fonctionnalités</h2>
      <label class="switch-field"
        ><span>Compteur tasbih dans Mes parts</span
        ><input type="checkbox" role="switch" formControlName="tasbih"
      /></label>
      <label class="switch-field"
        ><span>Photo dans un wird</span
        ><input type="checkbox" role="switch" formControlName="photo"
      /></label>
      <label class="switch-field"
        ><span>Note vocale dans un wird</span
        ><input type="checkbox" role="switch" formControlName="audio"
      /></label>
      <p class="admin-hint">
        Désactiver masque la fonction pour tout le monde. Les photos et voix déjà publiées restent
        visibles.
      </p>
    </section>
    @if (error()) {
      <p class="feedback feedback--error" role="alert">{{ error() }}</p>
    }
    @if (message()) {
      <p class="feedback" role="status">{{ message() }}</p>
    }
    <button type="submit" class="button button--primary" [disabled]="busy()">
      <app-icon name="check" [size]="22" />Enregistrer
    </button>
  </form>`,
  styleUrl: '../../admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminFeatures {
  private readonly api = inject(AdminApi);
  private readonly config = inject(AppConfig);
  protected readonly form = new FormGroup({
    tasbih: new FormControl(true, { nonNullable: true }),
    photo: new FormControl(true, { nonNullable: true }),
    audio: new FormControl(true, { nonNullable: true }),
  });
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    void this.config.load(true).then(() => this.form.setValue(this.config.features()));
  }

  protected async save(): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    this.error.set('');
    try {
      await this.api.saveSetting('features', this.form.getRawValue());
      await this.config.load(true);
      this.message.set('Fonctionnalités enregistrées.');
    } catch {
      this.error.set('Les réglages n’ont pas pu être enregistrés. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }
}
