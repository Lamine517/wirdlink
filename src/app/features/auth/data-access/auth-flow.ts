import { DestroyRef, Injectable, inject, signal } from '@angular/core';
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
  private readonly destroyRef = inject(DestroyRef);
  private sessionRevision = 0;
  private readonly currentSession = signal<ResponsibleSession | null>(null);
  readonly session = this.currentSession.asReadonly();
  private readonly pendingPhone = signal('');
  readonly phone = this.pendingPhone.asReadonly();
  readonly retryAt = signal(0);
  readonly restoring = signal(true);
  readonly ready: Promise<void>;

  constructor() {
    const stop = this.gateway.watchSession((session) => {
      this.sessionRevision++;
      this.currentSession.set(session);
    });
    this.destroyRef.onDestroy(stop);
    this.ready = this.restore();
  }

  private async restore(): Promise<void> {
    const revision = this.sessionRevision;
    try {
      const session = await this.gateway.restoreSession();
      if (!this.destroyRef.destroyed && revision === this.sessionRevision)
        this.currentSession.set(session);
    } catch {
      // A failed restore never grants publication rights or deletes a local draft.
    } finally {
      this.restoring.set(false);
    }
  }

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
    const session = await this.gateway.verifyCode(this.phone(), code);
    this.sessionRevision++;
    this.currentSession.set(session);
    this.pendingPhone.set('');
  }

  async oauth(provider: SignInProvider): Promise<void> {
    await this.gateway.signInWithProvider(provider);
  }

  async completeOAuth(code: string): Promise<void> {
    if (!code || code.length > 4096) throw new Error('Invalid sign-in return');
    const session = await this.gateway.completeSignIn(code);
    this.sessionRevision++;
    this.currentSession.set(session);
  }

  async signOut(): Promise<void> {
    await this.gateway.signOut();
    this.sessionRevision++;
    this.currentSession.set(null);
    this.pendingPhone.set('');
  }

  changePhone(): void {
    this.pendingPhone.set('');
  }
}
