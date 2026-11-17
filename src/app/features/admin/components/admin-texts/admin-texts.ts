import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import { AppConfig, TextSettings } from '../../../../core/config/app-config';
import { AdminApi } from '../../data-access/admin-api';

function localized(max: number) {
  const control = () =>
    new FormControl('', { nonNullable: true, validators: [Validators.maxLength(max)] });
  return new FormGroup({ fr: control(), en: control(), ar: control() });
}

@Component({
  selector: 'app-admin-texts',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './admin-texts.html',
  styleUrl: '../../admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTexts {
  private readonly api = inject(AdminApi);
  private readonly config = inject(AppConfig);
  protected readonly languages = [
    { id: 'fr', label: 'Français' },
    { id: 'en', label: 'Anglais (facultatif)' },
    { id: 'ar', label: 'Arabe (facultatif)' },
  ] as const;
  protected readonly form = new FormGroup({
    announcement: new FormGroup({
      active: new FormControl(false, { nonNullable: true }),
      ...localized(500).controls,
    }),
    help: localized(6000),
    conditions: localized(6000),
  });
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    void this.config.load(true).then(() => this.form.setValue(this.config.texts()));
  }

  protected async save(): Promise<void> {
    this.message.set('');
    this.error.set('');
    const texts: TextSettings = this.form.getRawValue();
    if (this.form.invalid) {
      this.error.set(
        'Un texte est trop long : 500 caractères pour l’annonce, 6 000 pour une page.',
      );
      return;
    }
    if (texts.announcement.active && !texts.announcement.fr.trim()) {
      this.error.set('Écrivez l’annonce en français avant de l’afficher.');
      return;
    }
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.saveSetting('texts', texts);
      await this.config.load(true);
      this.message.set('Textes enregistrés.');
    } catch {
      this.error.set('Les textes n’ont pas pu être enregistrés. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }
}
