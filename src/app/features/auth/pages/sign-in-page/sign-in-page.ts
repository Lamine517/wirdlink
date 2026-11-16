import { BackButton } from '../../../../shared/components/back-button/back-button';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  NgZone,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthFlow, normalizePhone } from '../../data-access/auth-flow';
import {
  InvalidCodeError,
  RateLimitError,
  ServiceUnavailableError,
  SignInProvider,
} from '../../../../core/services/frontend-gateway';
import { NetworkStatus } from '../../../../core/services/network-status';
import { RequestState } from '../../../../shared/components/request-state/request-state';

@Component({
  selector: 'app-sign-in-page',
  imports: [BackButton, ReactiveFormsModule, RequestState],
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
  protected readonly phone = new FormControl(this.auth.phone(), {
    nonNullable: true,
    validators: [
      Validators.required,
      (control) => (normalizePhone(control.value) ? null : { phone: true }),
    ],
  });
  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.pattern(/^\d{6}$/), Validators.required],
  });
  protected readonly verifying = computed(() => Boolean(this.auth.phone()));
  protected readonly busy = signal(false);
  private readonly verifyRetryAt = signal(0);
  protected readonly verifyCooldown = computed(() =>
    Math.max(0, Math.ceil((this.verifyRetryAt() - this.clock()) / 1000)),
  );
  protected readonly error = signal('');
  protected readonly clock = signal(Date.now());
  protected readonly cooldown = computed(() =>
    Math.max(0, Math.ceil((this.auth.retryAt() - this.clock()) / 1000)),
  );
  protected readonly callbackMode = this.route.snapshot.routeConfig?.path === 'connexion/retour';

  constructor() {
    const timer = inject(NgZone).runOutsideAngular(() =>
      setInterval(() => this.clock.set(Date.now()), 1000),
    );
    this.destroyRef.onDestroy(() => clearInterval(timer));
    if (this.callbackMode) void this.callback();
  }

  protected async sendCode(): Promise<void> {
    if (this.busy() || !this.network.online() || this.cooldown()) return;
    const phone = this.verifying() ? this.auth.phone() : this.phone.value;
    if (!normalizePhone(phone)) {
      this.phone.markAsTouched();
      return;
    }
    await this.perform(
      () => this.auth.requestCode(phone),
      'Impossible d’envoyer le code. Réessayez dans un instant.',
    );
  }

  protected async verify(): Promise<void> {
    if (this.busy() || !this.network.online() || this.verifyCooldown()) return;
    this.code.markAsTouched();
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    await this.perform(async () => {
      await this.auth.verifyCode(this.code.value);
      if (!this.destroyRef.destroyed) await this.router.navigateByUrl('/creer/apercu');
    }, 'Impossible de vérifier le code. Réessayez.');
  }

  protected async oauth(provider: SignInProvider): Promise<void> {
    if (this.busy() || !this.network.online()) return;
    await this.perform(
      () => this.auth.oauth(provider),
      'Connexion indisponible. Réessayez dans un instant.',
    );
  }

  protected changePhone(): void {
    this.auth.changePhone();
    this.code.reset();
    this.error.set('');
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
      if (!this.destroyRef.destroyed)
        await this.router.navigateByUrl('/creer/apercu', { replaceUrl: true });
    }, 'La connexion a expiré. Recommencez pour continuer.');
  }

  private async perform(action: () => Promise<void>, fallback: string): Promise<void> {
    this.busy.set(true);
    this.error.set('');
    try {
      await action();
    } catch (error) {
      if (error instanceof ServiceUnavailableError) {
        this.error.set('La connexion n’est pas encore disponible. Votre brouillon est conservé.');
      } else if (error instanceof InvalidCodeError) {
        this.code.setErrors({ incorrect: true });
        this.error.set('Code incorrect ou expiré. Vérifiez les 6 chiffres reçus.');
      } else if (error instanceof RateLimitError) {
        const until = Date.now() + Math.max(1, error.retryAfterSeconds) * 1000;
        if (this.verifying()) this.verifyRetryAt.set(until);
        else this.auth.retryAt.set(until);
        this.error.set('Trop de tentatives. Patientez avant de réessayer.');
      } else {
        this.error.set(fallback);
      }
    } finally {
      this.clock.set(Date.now());
      this.busy.set(false);
    }
  }
}
