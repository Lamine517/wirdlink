import { Translate } from '../../../../shared/pipes/translate';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthFlow, takeAuthReturn } from '../../data-access/auth-flow';
import { CreationDraftStore } from '../../../creation/data-access/creation-draft';
import {
  AccountAlreadyExistsError,
  ServiceUnavailableError,
  SignInProvider,
} from '../../../../core/services/frontend-gateway';
import { NetworkStatus } from '../../../../core/services/network-status';
import { Icon } from '../../../../shared/components/icon/icon';
import { RequestState } from '../../../../shared/components/request-state/request-state';

@Component({
  selector: 'app-sign-in-page',
  imports: [Translate, ReactiveFormsModule, BackButton, RequestState, Icon],
  templateUrl: './sign-in-page.html',
  styleUrl: './sign-in-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInPage {
  protected readonly auth = inject(AuthFlow);
  protected readonly network = inject(NetworkStatus);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  protected readonly emailAddress = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email, Validators.maxLength(254)],
  });
  protected readonly emailSent = signal(false);
  protected readonly existingAccount = signal(false);
  protected readonly method = signal<'phone' | 'email'>('email');
  private readonly pendingProvider = signal<SignInProvider | 'email' | null>(null);
  private readonly draft = inject(CreationDraftStore);
  protected readonly callbackMode = this.route.snapshot.routeConfig?.path === 'connexion/retour';

  constructor() {
    if (this.callbackMode) void this.callback();
  }

  protected returnFallback(): string {
    const stored = sessionStorage.getItem('wirdlink.auth.return');
    return stored === '/' || stored === '/preferences' ? stored : '/creer/apercu';
  }

  protected async sendEmail(replaceGuest = false): Promise<void> {
    this.emailAddress.markAsTouched();
    if (this.emailAddress.invalid || this.busy() || !this.network.online()) return;
    this.pendingProvider.set('email');
    await this.perform(async () => {
      await this.auth.email(this.emailAddress.value, replaceGuest);
      this.emailSent.set(true);
    }, 'Le lien n’a pas pu être envoyé. Réessayez.');
  }

  protected async oauth(provider: SignInProvider, replaceGuest = false): Promise<void> {
    if (this.busy() || !this.network.online()) return;
    this.pendingProvider.set(provider);
    await this.perform(
      () => this.auth.oauth(provider, replaceGuest),
      'Connexion indisponible. Réessayez dans un instant.',
    );
  }

  protected replaceGuest(): void {
    const pending = this.pendingProvider();
    if (pending === 'email') void this.sendEmail(true);
    else if (pending) void this.oauth(pending, true);
  }

  protected async retryCallback(): Promise<void> {
    await this.router.navigateByUrl('/connexion', { replaceUrl: true });
  }

  private async callback(): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const code = params.get('code');
    // Remove provider parameters from history immediately; no arbitrary redirect is accepted.
    window.history.replaceState(window.history.state, '', '/connexion/retour');
    if (!code || params.has('error')) {
      this.error.set('La connexion a été interrompue. Réessayez.');
      return;
    }
    await this.perform(async () => {
      await this.auth.completeOAuth(code);
      if (!this.destroyRef.destroyed) {
        const draft = this.draft.draft();
        const ready =
          this.draft.contentValid() &&
          this.draft.scheduleValid() &&
          draft.title.trim().length > 0;
        await this.router.navigateByUrl(takeAuthReturn(ready), { replaceUrl: true });
      }
    }, 'La connexion a expiré. Recommencez pour continuer.');
  }

  private async perform(action: () => Promise<void>, fallback: string): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    this.existingAccount.set(false);
    try {
      await action();
    } catch (error) {
      if (error instanceof AccountAlreadyExistsError) {
        this.existingAccount.set(true);
        return;
      }
      if (error instanceof ServiceUnavailableError) {
        this.error.set(
          'Connexion impossible pour le moment. Réessayez, votre brouillon est conservé.',
        );
      } else {
        this.error.set(fallback);
      }
    } finally {
      this.busy.set(false);
    }
  }
}
