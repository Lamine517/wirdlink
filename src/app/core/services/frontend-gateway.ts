import { InjectionToken } from '@angular/core';
import { CreationDraft, LocalMedia } from '../../features/creation/data-access/creation-draft';
import { Wird } from '../wird-store';

export type SignInProvider = 'google' | 'apple';
export interface ResponsibleSession {
  id: string;
  displayName?: string;
}
export interface UserProfile {
  firstName: string;
  lastName: string;
  address: string;
  organization: string;
}
export interface WirdAuthor {
  displayName: string;
  organization: string;
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

/** Frontend boundary: the server verifies authentication, permissions and counts.
 * appConfig connects real Supabase authentication. Other operations stay closed.
 * Tests replace this port; no successful sign-in/publication is simulated in the app.
 */
export interface FrontendGateway {
  restoreSession(): Promise<ResponsibleSession | null>;
  watchSession(listener: (session: ResponsibleSession | null) => void): () => void;
  signOut(): Promise<void>;
  deleteAccount(): Promise<void>;
  loadProfile(): Promise<UserProfile>;
  saveProfile(profile: UserProfile): Promise<void>;
  loadWirdAuthor(wirdId: string): Promise<WirdAuthor | null>;
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
    restoreSession: () => Promise.resolve(null),
    watchSession: () => () => undefined,
    signOut: unavailable,
    deleteAccount: unavailable,
    loadProfile: unavailable,
    saveProfile: unavailable,
    loadWirdAuthor: unavailable,
    requestCode: unavailable,
    verifyCode: unavailable,
    signInWithProvider: unavailable,
    completeSignIn: unavailable,
    publish: unavailable,
    unlock: unavailable,
    setReminders: unavailable,
  }),
});
