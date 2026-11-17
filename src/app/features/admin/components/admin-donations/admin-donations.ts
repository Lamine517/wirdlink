import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import { AppConfig, DonationSettings } from '../../../../core/config/app-config';
import { AdminApi } from '../../data-access/admin-api';

/** Turns "500, 1 000; 2000" into [500, 1000, 2000]; null when one value is not a whole amount. */
export function parseAmounts(value: string): number[] | null {
  const parts = value
    .split(/[,;]/)
    .map((item) => item.replace(/\s/g, ''))
    .filter(Boolean);
  if (parts.length < 1 || parts.length > 6) return null;
  const amounts = parts.map(Number);
  return amounts.every((item) => Number.isSafeInteger(item) && item > 0 && item <= 10_000_000)
    ? amounts
    : null;
}

@Component({
  selector: 'app-admin-donations',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './admin-donations.html',
  styleUrl: '../../admin-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDonations {
  private readonly api = inject(AdminApi);
  private readonly config = inject(AppConfig);
  protected readonly form = new FormGroup({
    enabled: new FormControl(true, { nonNullable: true }),
    amounts: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    min: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    max: new FormControl(0, { nonNullable: true, validators: [Validators.min(1)] }),
    number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.pattern(/^\s*(\d\s*){9}$/)],
    }),
    wave: new FormControl(true, { nonNullable: true }),
    orange: new FormControl(true, { nonNullable: true }),
  });
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    void this.config.load(true).then(() => this.fill(this.config.donations()));
  }

  private fill(settings: DonationSettings): void {
    this.form.setValue({ ...settings, amounts: settings.amounts.join(', ') });
  }

  protected async save(): Promise<void> {
    this.message.set('');
    this.error.set('');
    const value = this.form.getRawValue();
    const amounts = parseAmounts(value.amounts);
    const settings: DonationSettings = {
      ...value,
      amounts: amounts ?? [],
      min: Math.trunc(value.min),
      max: Math.trunc(value.max),
      number: value.number.replace(/\s/g, ''),
    };
    if (this.form.invalid || !amounts || settings.min > settings.max) {
      this.error.set(
        'Vérifiez : 1 à 6 montants séparés par des virgules, un minimum inférieur au maximum et un numéro à 9 chiffres.',
      );
      return;
    }
    if (settings.enabled && !settings.wave && !settings.orange) {
      this.error.set('Gardez au moins Wave ou Orange Money.');
      return;
    }
    if (this.busy()) return;
    this.busy.set(true);
    try {
      await this.api.saveSetting('donations', settings);
      await this.config.load(true);
      this.fill(this.config.donations());
      this.message.set('Réglages des dons enregistrés.');
    } catch {
      this.error.set('Les réglages n’ont pas pu être enregistrés. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }
}
