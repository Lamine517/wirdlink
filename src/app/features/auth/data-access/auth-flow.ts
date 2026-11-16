import { Injectable, inject, signal } from '@angular/core';
import {
  FRONTEND_GATEWAY,
  ResponsibleSession,
  SignInProvider,
} from '../../../core/services/frontend-gateway';

export function normalizePhone(value: string): string | null {
  const digits = value.replace(/[\s().-]/g, '').replace(/^00221/, '+221');
  const national = digits.startsWith('+221') ? digits.slice(4) : digits;
  return /^7[05678]\d{7}$/.test(national) ? '+221' + national : null;
}

@Injectable({ providedIn: 'root' })
export class AuthFlow {
  private readonly gateway = inject(FRONTEND_GATEWAY);
  private readonly currentSession = signal<ResponsibleSession | null>(null);
  readonly session = this.currentSession.asReadonly();
  private readonly pendingPhone = signal('');
  readonly phone = this.pendingPhone.asReadonly();
  readonly retryAt = signal(0);

  async requestCode(phone: string): Promise<void> {
    const normalized = normalizePhone(phone);
    if (!normalized) throw new Error('Invalid phone');
    if (this.retryAt() > Date.now()) throw new Error('Wait before requesting another code');
    await this.gateway.requestCode(normalized);
    this.pendingPhone.set(normalized);
    this.retryAt.set(Date.now() + 60000);
  }

  async verifyCode(code: string): Promise<void> {
    if (!this.phone() || !/^\d{6}$/.test(code)) throw new Error('Invalid code');
    this.currentSession.set(await this.gateway.verifyCode(this.phone(), code));
    this.pendingPhone.set('');
  }

  async oauth(provider: SignInProvider): Promise<void> {
    await this.gateway.signInWithProvider(provider);
  }

  async completeOAuth(code: string): Promise<void> {
    if (!code || code.length > 4096) throw new Error('Invalid sign-in return');
    this.currentSession.set(await this.gateway.completeSignIn(code));
  }

  changePhone(): void {
    this.pendingPhone.set('');
  }
}
