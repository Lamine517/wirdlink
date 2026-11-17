import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Translate } from '../../../../shared/pipes/translate';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { NetworkStatus } from '../../../../core/services/network-status';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-profile-edit-page',
  imports: [Translate, ReactiveFormsModule, BackButton, RequestState, Icon],
  templateUrl: './profile-edit-page.html',
  styleUrl: './profile-edit-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileEditPage {
  protected readonly auth = inject(AuthFlow);
  protected readonly network = inject(NetworkStatus);
  private readonly gateway = inject(FRONTEND_GATEWAY);
  private readonly router = inject(Router);
  protected readonly loading = signal(true);
  protected readonly loaded = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  private loadVersion = 0;
  private readonly userId = computed(() => this.auth.session()?.id ?? null);
  protected readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(60)] }),
    organization: new FormControl('', {
      nonNullable: true,
      validators: [Validators.maxLength(120)],
    }),
  });

  constructor() {
    effect((onCleanup) => {
      this.userId();
      onCleanup(() => {
        this.loadVersion++;
      });
      this.form.reset();
      this.loaded.set(false);
      void this.load();
    });
  }

  protected async load(): Promise<void> {
    const version = ++this.loadVersion;
    this.loading.set(true);
    this.error.set('');
    try {
      await this.auth.ready;
      const id = this.auth.session()?.id;
      if (!id || version !== this.loadVersion) return;
      const profile = await this.gateway.loadProfile();
      if (id !== this.auth.session()?.id || version !== this.loadVersion) return;
      this.form.setValue(profile);
      this.loaded.set(true);
    } catch {
      if (version === this.loadVersion)
        this.error.set('Impossible de charger votre profil. Réessayez.');
    } finally {
      if (version === this.loadVersion) this.loading.set(false);
    }
  }

  protected async save(): Promise<void> {
    if (this.busy() || !this.loaded() || !this.network.online()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    try {
      const profile = this.form.getRawValue();
      const userId = this.userId();
      await this.gateway.saveProfile(profile);
      if (userId !== this.userId()) return;
      this.auth.updateDisplayName([profile.firstName, profile.lastName].filter(Boolean).join(' '));
      this.form.markAsPristine();
      await this.router.navigate(['/profil'], { state: { profileSaved: true } });
    } catch {
      this.error.set('Impossible d’enregistrer votre profil. Vos modifications sont conservées.');
    } finally {
      this.busy.set(false);
    }
  }
}
