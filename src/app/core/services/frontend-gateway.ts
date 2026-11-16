import { InjectionToken } from '@angular/core';
import { CreationDraft, LocalMedia } from '../../features/creation/data-access/creation-draft';
import { Wird } from '../wird-store';

export type SignInProvider = 'google' | 'apple';
export interface ResponsibleSession {
  id: string;
}
export interface PublicationReceipt {
  id: string;
  title: string;
  visibility: 'public' | 'private';
  shareUrl: string;
  accessCode?: string;
}
export interface PublicationRequest {
  requestId: string;
  draft: CreationDraft;
  image: LocalMedia | null;
  audio: LocalMedia | null;
}

/** Frontend boundary: the server must verify authentication, permissions and counts.
 * Production intentionally fails closed until an adapter is connected and verified.
 * Tests replace this port; no successful sign-in/publication is simulated in the app.
 */
export interface FrontendGateway {
  requestCode(phone: string): Promise<void>;
  verifyCode(phone: string, code: string): Promise<ResponsibleSession>;
  signInWithProvider(provider: SignInProvider): Promise<void>;
  completeSignIn(code: string): Promise<ResponsibleSession>;
  publish(request: PublicationRequest): Promise<PublicationReceipt>;
  setReminders(enabled: boolean): Promise<void>;
  unlock(wirdId: string, code: string): Promise<Wird>;
}

export class ServiceUnavailableError extends Error {
  constructor() {
    super('Service unavailable');
    this.name = 'ServiceUnavailableError';
  }
}
export class InvalidCodeError extends Error {
  constructor() {
    super('Invalid or expired code');
    this.name = 'InvalidCodeError';
  }
}
export class RateLimitError extends Error {
  constructor(readonly retryAfterSeconds = 60) {
    super('Too many attempts');
    this.name = 'RateLimitError';
  }
}

const unavailable = (): Promise<never> => Promise.reject(new ServiceUnavailableError());
export const FRONTEND_GATEWAY = new InjectionToken<FrontendGateway>('FRONTEND_GATEWAY', {
  providedIn: 'root',
  factory: () => ({
    requestCode: unavailable,
    verifyCode: unavailable,
    signInWithProvider: unavailable,
    completeSignIn: unavailable,
    publish: unavailable,
    unlock: unavailable,
    setReminders: unavailable,
  }),
});
