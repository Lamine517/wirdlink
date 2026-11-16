import { Injectable, inject } from '@angular/core';
import type { AuthError, User } from '@supabase/supabase-js';
import {
  FrontendGateway,
  InvalidCodeError,
  RateLimitError,
  ResponsibleSession,
  ServiceUnavailableError,
  SignInProvider,
} from '../services/frontend-gateway';
import { SUPABASE_AUTH_METHODS, SUPABASE_CLIENT } from './supabase-client';

function responsibleSession(user: User | null): ResponsibleSession | null {
  return user && user.is_anonymous === false ? { id: user.id } : null;
}

export function translateAuthError(error: AuthError): Error {
  if (
    error.status === 429 ||
    error.code === 'over_request_rate_limit' ||
    error.code === 'over_sms_send_rate_limit'
  ) return new RateLimitError();
  if (error.code === 'otp_expired') return new InvalidCodeError();
  if (
    error.code === 'bad_code_verifier' ||
    error.code === 'flow_state_expired' ||
    error.code === 'flow_state_not_found'
  ) return new Error('Sign-in return expired');
  // Do not expose provider details, tokens or raw server error messages to the UI.
  return new ServiceUnavailableError();
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthGateway implements FrontendGateway {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly methods = inject(SUPABASE_AUTH_METHODS);

  async restoreSession(): Promise<ResponsibleSession | null> {
    const { auth } = await this.client();
    const cached = await auth.getSession();
    if (cached.error || !cached.data.session) return null;
    // Validate restored identity with Auth; browser storage alone is not evidence.
    const { data, error } = await auth.getUser();
    if (error) throw translateAuthError(error);
    return responsibleSession(data.user);
  }

  watchSession(listener: (session: ResponsibleSession | null) => void): () => void {
    let active = true;
    let unsubscribe: () => void = () => undefined;
    void this.client()
      .then(({ auth }) => {
        if (!active) return;
        const { data } = auth.onAuthStateChange((event, session) => {
          // Initial storage is validated by restoreSession. Never await SDK calls here.
          if (active && event !== 'INITIAL_SESSION')
            listener(responsibleSession(session?.user ?? null));
        });
        unsubscribe = () => data.subscription.unsubscribe();
      })
      .catch(() => {
        if (active) listener(null);
      });
    return () => {
      active = false;
      unsubscribe();
    };
  }

  async requestCode(phone: string): Promise<void> {
    if (!(await this.methods()).phone) throw new ServiceUnavailableError();
    const { error } = await (await this.client()).auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    if (error) throw translateAuthError(error);
  }

  async verifyCode(phone: string, code: string): Promise<ResponsibleSession> {
    const { data, error } = await (await this.client()).auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) throw translateAuthError(error);
    const session = responsibleSession(data.user);
    if (!session) throw new ServiceUnavailableError();
    return session;
  }

  async signInWithProvider(provider: SignInProvider): Promise<void> {
    if (!(await this.methods())[provider]) throw new ServiceUnavailableError();
    const { error } = await (await this.client()).auth.signInWithOAuth({
      provider,
      options: { redirectTo: window.location.origin + '/connexion/retour' },
    });
    if (error) throw translateAuthError(error);
  }

  async completeSignIn(code: string): Promise<ResponsibleSession> {
    const { data, error } = await (await this.client()).auth.exchangeCodeForSession(code);
    if (error) throw translateAuthError(error);
    const session = responsibleSession(data.user);
    if (!session) throw new ServiceUnavailableError();
    return session;
  }

  async signOut(): Promise<void> {
    const { error } = await (await this.client()).auth.signOut({ scope: 'local' });
    if (error) throw translateAuthError(error);
  }

  // Publishing stays closed until remote reads, private access and media are connected.
  publish(): Promise<never> {
    return Promise.reject(new ServiceUnavailableError());
  }
  unlock(): Promise<never> {
    return Promise.reject(new ServiceUnavailableError());
  }
  setReminders(): Promise<never> {
    return Promise.reject(new ServiceUnavailableError());
  }
}
