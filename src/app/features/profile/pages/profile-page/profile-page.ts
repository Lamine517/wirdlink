import { Translate } from '../../../../shared/pipes/translate';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { CreationDraftStore } from '../../../creation/data-access/creation-draft';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { NetworkStatus } from '../../../../core/services/network-status';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { RequestState } from '../../../../shared/components/request-state/request-state';
import { UserAvatar } from '../../../../shared/components/user-avatar/user-avatar';

@Component({
  selector: 'app-profile-page',
  imports: [Translate, ReactiveFormsModule, BackButton, BottomSheet, RequestState, UserAvatar],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  protected readonly auth = inject(AuthFlow);
  protected readonly network = inject(NetworkStatus);
  private readonly gateway = inject(FRONTEND_GATEWAY);
  private readonly draft = inject(CreationDraftStore);
  protected readonly loading = signal(true);
  protected readonly loaded = signal(false);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly message = signal('');
  protected readonly deleting = signal(false);
  protected readonly deletionError = signal('');
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
    if (this.busy() || this.deleting() || !this.loaded() || !this.network.online()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    try {
      const profile = this.form.getRawValue();
      const userId = this.userId();
      await this.gateway.saveProfile(profile);
      if (userId !== this.userId()) return;
      this.auth.updateDisplayName([profile.firstName, profile.lastName].filter(Boolean).join(' '));
      this.form.markAsPristine();
      this.message.set('Profil enregistré.');
    } catch {
      this.error.set('Impossible d’enregistrer votre profil. Vos modifications sont conservées.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async signOutConfirmed(sheet: BottomSheet): Promise<void> {
    await this.signOut();
    if (!this.auth.session()) sheet.close();
  }

  protected async signOut(): Promise<void> {
    if (this.busy() || this.deleting() || !this.network.online()) return;
    this.busy.set(true);
    this.error.set('');
    try {
      await this.auth.signOut();
      this.message.set('Vous êtes déconnecté.');
    } catch {
      this.error.set('Impossible de vous déconnecter. Réessayez.');
    } finally {
      this.busy.set(false);
    }
  }

  protected async deleteAccount(sheet: BottomSheet): Promise<void> {
    if (this.deleting() || this.busy() || !this.auth.session() || !this.network.online()) return;
    this.deleting.set(true);
    this.deletionError.set('');
    try {
      await this.auth.deleteAccount();
      this.draft.discard();
      sheet.close();
      this.message.set('Votre compte a été supprimé.');
    } catch {
      this.deletionError.set('La suppression n’est pas terminée. Réessayez pour la finaliser.');
    } finally {
      this.deleting.set(false);
    }
  }
}
