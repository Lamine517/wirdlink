import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Icon } from '../../../../shared/components/icon/icon';
import { PassService, PassSettings } from '../../../../core/pass/pass-service';
import { AdminApi } from '../../data-access/admin-api';

function amount(max: number): FormControl<number> {
  return new FormControl(0, {
    nonNullable: true,
    validators: [Validators.required, Validators.min(0), Validators.max(max)],
  });
}

@Component({
  selector: 'app-admin-settings',
  imports: [ReactiveFormsModule, Icon],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettings {
  private readonly api = inject(AdminApi);
  private readonly passes = inject(PassService);
  protected readonly form = new FormGroup({
    enabled: new FormControl(false, { nonNullable: true }),
    monthPrice: amount(1_000_000),
    yearPrice: amount(1_000_000),
    founderPrice: amount(1_000_000),
    founderSlots: amount(10_000),
    trialDays: amount(365),
    freePrivateLimit: amount(1000),
    limitStartsOn: new FormControl('', { nonNullable: true }),
    reminderDays: amount(60),
  });
  protected readonly busy = signal(false);
  protected readonly message = signal('');
  protected readonly error = signal('');

  constructor() {
    void this.passes.loadSettings(true).then((settings) => this.fill(settings));
  }

  private fill(settings: PassSettings): void {
    this.form.setValue({ ...settings, limitStartsOn: settings.limitStartsOn ?? '' });
    this.form.markAsPristine();
  }

  protected async save(): Promise<void> {
    this.message.set('');
    this.error.set('');
    if (this.form.invalid || this.busy()) {
      this.form.markAllAsTouched();
      this.error.set('Vérifiez les montants : nombres entiers positifs uniquement.');
      return;
    }
    const value = this.form.getRawValue();
    const settings: PassSettings = {
      ...value,
      monthPrice: Math.trunc(value.monthPrice),
      yearPrice: Math.trunc(value.yearPrice),
      founderPrice: Math.trunc(value.founderPrice),
      founderSlots: Math.trunc(value.founderSlots),
      trialDays: Math.trunc(value.trialDays),
      freePrivateLimit: Math.trunc(value.freePrivateLimit),
      reminderDays: Math.trunc(value.reminderDays),
      limitStartsOn: value.limitStartsOn || null,
    };
    this.busy.set(true);
    try {
      await this.api.savePassSettings(settings);
      this.fill(await this.passes.loadSettings(true));
      this.message.set('Réglages enregistrés.');
    } catch {
      this.error.set('Les réglages n’ont pas pu être enregistrés. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }
}
