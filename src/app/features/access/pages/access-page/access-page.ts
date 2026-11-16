import { Translate } from '../../../../shared/pipes/translate';
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
import { WirdAccess } from '../../data-access/wird-access';
import {
  GuestAccessError,
  InvalidCodeError,
  RateLimitError,
  ServiceUnavailableError,
} from '../../../../core/services/frontend-gateway';
import { NetworkStatus } from '../../../../core/services/network-status';
import { Icon } from '../../../../shared/components/icon/icon';
import { RequestState } from '../../../../shared/components/request-state/request-state';

@Component({
  selector: 'app-access-page',
  imports: [Translate, BackButton, ReactiveFormsModule, Icon, RequestState],
  templateUrl: './access-page.html',
  styleUrl: './access-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccessPage {
  private readonly access = inject(WirdAccess);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly network = inject(NetworkStatus);
  protected readonly code = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.pattern(/^\d{4}$/)],
  });
  protected readonly busy = signal(false);
  protected readonly error = signal('');
  private readonly retryAt = signal(0);
  private readonly clock = signal(Date.now());
  protected readonly cooldown = computed(() =>
    Math.max(0, Math.ceil((this.retryAt() - this.clock()) / 1000)),
  );

  constructor() {
    const timer = inject(NgZone).runOutsideAngular(() =>
      setInterval(() => this.clock.set(Date.now()), 1000),
    );
    this.destroyRef.onDestroy(() => clearInterval(timer));
  }

  protected async unlock(): Promise<void> {
    if (this.busy() || !this.network.online() || this.cooldown()) return;
    this.code.markAsTouched();
    if (this.code.invalid) {
      this.code.markAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');
    try {
      const id = this.route.snapshot.paramMap.get('id') ?? '';
      await this.access.unlock(id, this.code.value);
      if (this.destroyRef.destroyed) return;
      const commands = ['/wird', id];
      if (this.route.snapshot.queryParamMap.get('view') === 'participants')
        commands.push('participants');
      await this.router.navigate(commands, { replaceUrl: true });
    } catch (error) {
      if (error instanceof InvalidCodeError) {
        this.code.setErrors({ incorrect: true });
        this.error.set('Ce code est incorrect ou a expiré. Vérifiez-le auprès du responsable.');
      } else if (error instanceof RateLimitError) {
        this.retryAt.set(Date.now() + Math.max(1, error.retryAfterSeconds) * 1000);
        this.error.set('Trop de tentatives. Patientez avant de réessayer.');
      } else if (error instanceof GuestAccessError) {
        this.error.set(
          'La participation sans compte n’est pas disponible pour le moment. Réessayez plus tard.',
        );
      } else if (error instanceof ServiceUnavailableError) {
        this.error.set('Impossible d’ouvrir ce wird. Réessayez dans un instant.');
      } else {
        this.error.set('Impossible d’ouvrir ce wird. Réessayez dans un instant.');
      }
    } finally {
      this.clock.set(Date.now());
      this.busy.set(false);
    }
  }
}
