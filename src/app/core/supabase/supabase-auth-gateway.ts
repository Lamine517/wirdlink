import { Injectable, inject } from '@angular/core';
import type { AuthError, User } from '@supabase/supabase-js';
import {
  FrontendGateway,
  InvalidCodeError,
  RateLimitError,
  ResponsibleSession,
  ServiceUnavailableError,
  SignInProvider,
  UserProfile,
  WirdAuthor,
} from '../services/frontend-gateway';
import { SUPABASE_AUTH_METHODS, SUPABASE_CLIENT } from './supabase-client';

function responsibleSession(user: User | null): ResponsibleSession | null {
  if (!user || user.is_anonymous !== false) return null;
  // Metadata is presentation only, never used for permissions.
  const name: unknown = user.user_metadata['full_name'] ?? user.user_metadata['name'];
  const displayName = typeof name === 'string' ? name.trim().slice(0, 100) : '';
  return displayName ? { id: user.id, displayName } : { id: user.id };
}

export function translateAuthError(error: AuthError): Error {
  if (
    error.status === 429 ||
    error.code === 'over_request_rate_limit' ||
    error.code === 'over_sms_send_rate_limit'
  )
    return new RateLimitError();
  if (error.code === 'otp_expired') return new InvalidCodeError();
  if (
    error.code === 'bad_code_verifier' ||
    error.code === 'flow_state_expired' ||
    error.code === 'flow_state_not_found'
  )
    return new Error('Sign-in return expired');
  // Do not expose provider details, tokens or raw server error messages to the UI.
  return new ServiceUnavailableError();
}

@Injectable({ providedIn: 'root' })
export class SupabaseAuthGateway implements FrontendGateway {
  private readonly client = inject(SUPABASE_CLIENT);
  private readonly methods = inject(SUPABASE_AUTH_METHODS);

  private async sessionWithProfile(user: User | null): Promise<ResponsibleSession | null> {
    const session = responsibleSession(user);
    if (!session) return null;
    try {
      const { data, error } = await (await this.client())
        .from('profiles')
        .select('first_name,last_name')
        .eq('id', session.id)
        .maybeSingle<{ first_name: string; last_name: string }>();
      if (error || !data) return session;
      const displayName = [data.first_name, data.last_name].filter(Boolean).join(' ').trim();
      return { ...session, displayName };
    } catch {
      return session;
    }
  }

  async restoreSession(): Promise<ResponsibleSession | null> {
    const { auth } = await this.client();
    const cached = await auth.getSession();
    if (cached.error || !cached.data.session) return null;
    // Validate restored identity with Auth; browser storage alone is not evidence.
    const { data, error } = await auth.getUser();
    if (error) throw translateAuthError(error);
    return this.sessionWithProfile(data.user);
  }

  watchSession(listener: (session: ResponsibleSession | null) => void): () => void {
    let active = true;
    let revision = 0;
    let unsubscribe: () => void = () => undefined;
    void this.client()
      .then(({ auth }) => {
        if (!active) return;
        const { data } = auth.onAuthStateChange((event, session) => {
          // Initial storage is validated by restoreSession. Never await SDK calls here.
          if (!active || event === 'INITIAL_SESSION') return;
          const current = ++revision;
          if (!session) {
            listener(null);
            return;
          }
          void this.sessionWithProfile(session.user).then((identity) => {
            if (active && current === revision) listener(identity);
          });
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
    const { error } = await (
      await this.client()
    ).auth.signInWithOtp({
      phone,
      options: { channel: 'sms' },
    });
    if (error) throw translateAuthError(error);
  }

  async verifyCode(phone: string, code: string): Promise<ResponsibleSession> {
    const { data, error } = await (
      await this.client()
    ).auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });
    if (error) throw translateAuthError(error);
    const session = responsibleSession(data.user);
    if (!session) throw new ServiceUnavailableError();
    return (await this.sessionWithProfile(data.user)) ?? session;
  }

  async signInWithProvider(provider: SignInProvider): Promise<void> {
    if (!(await this.methods())[provider]) throw new ServiceUnavailableError();
    const { error } = await (
      await this.client()
    ).auth.signInWithOAuth({
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
    return (await this.sessionWithProfile(data.user)) ?? session;
  }

  async signOut(): Promise<void> {
    const { error } = await (await this.client()).auth.signOut({ scope: 'local' });
    if (error) throw translateAuthError(error);
  }

  async deleteAccount(): Promise<void> {
    const client = await this.client();
    const { data, error } = await client.functions.invoke<{ deleted: boolean }>('delete-account', {
      body: { confirmation: 'DELETE_ACCOUNT' },
    });
    if (error || data?.deleted !== true) throw new ServiceUnavailableError();
    // The server has deleted the identity. A local sign-out failure cannot undo it.
    await client.auth.signOut({ scope: 'local' }).catch(() => undefined);
  }

  async loadProfile(): Promise<UserProfile> {
    const client = await this.client();
    const { data: identity, error: identityError } = await client.auth.getUser();
    if (identityError || !responsibleSession(identity.user)) throw new ServiceUnavailableError();
    const { data, error } = await client
      .from('profiles')
      .select('first_name,last_name,address,organization')
      .eq('id', identity.user!.id)
      .maybeSingle<{
        first_name: string;
        last_name: string;
        address: string;
        organization: string;
      }>();
    if (error) throw new ServiceUnavailableError();
    return {
      firstName: data?.first_name ?? '',
      lastName: data?.last_name ?? '',
      address: data?.address ?? '',
      organization: data?.organization ?? '',
    };
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    const client = await this.client();
    const { data, error: identityError } = await client.auth.getUser();
    if (identityError || !responsibleSession(data.user)) throw new ServiceUnavailableError();
    const { error } = await client.from('profiles').upsert({
      id: data.user!.id,
      first_name: profile.firstName.trim(),
      last_name: profile.lastName.trim(),
      address: profile.address.trim(),
      organization: profile.organization.trim(),
    });
    if (error) throw new ServiceUnavailableError();
  }

  async loadWirdAuthor(wirdId: string): Promise<WirdAuthor | null> {
    const { data, error } = await (await this.client()).rpc('wird_author', { p_wird_id: wirdId });
    if (error) throw new ServiceUnavailableError();
    if (!Array.isArray(data) || data.length === 0) return null;
    const author: unknown = data[0];
    if (
      !author ||
      typeof author !== 'object' ||
      !('display_name' in author) ||
      !('organization' in author) ||
      typeof author.display_name !== 'string' ||
      typeof author.organization !== 'string'
    )
      throw new ServiceUnavailableError();
    return { displayName: author.display_name, organization: author.organization };
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
