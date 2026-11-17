import { Injectable, inject } from '@angular/core';
import type { AuthError, User } from '@supabase/supabase-js';
import {
  FrontendGateway,
  InvalidCodeError,
  RateLimitError,
  ResponsibleSession,
  PublicationRequest,
  PublicationReceipt,
  AccountAlreadyExistsError,
  ServiceUnavailableError,
  SignInProvider,
  UserProfile,
  WirdAuthor,
} from '../services/frontend-gateway';
import type { Wird } from '../wird-store';
import { SupabaseWirdRepository } from './supabase-wird-repository';
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
  private readonly wirds = inject(SupabaseWirdRepository);
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
          if (event === 'TOKEN_REFRESHED' && !session) return;
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

  async signInWithEmail(email: string, replaceGuest = false): Promise<void> {
    const normalized = email.trim().toLowerCase();
    if (normalized.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized))
      throw new Error('Invalid email');
    const redirectTo = window.location.origin + '/connexion/retour';
    const client = await this.client();
    if (!replaceGuest && (await this.guestSession())) {
      const { error } = await client.auth.updateUser(
        { email: normalized },
        { emailRedirectTo: redirectTo },
      );
      if (error) throw this.accountConflict(error);
      return;
    }
    const { error } = await client.auth.signInWithOtp({
      email: normalized,
      options: { emailRedirectTo: redirectTo },
    });
    if (error) throw translateAuthError(error);
  }

  async signInWithProvider(provider: SignInProvider, replaceGuest = false): Promise<void> {
    if (!(await this.methods())[provider]) throw new ServiceUnavailableError();
    const redirectTo = window.location.origin + '/connexion/retour';
    const client = await this.client();
    if (!replaceGuest && (await this.guestSession())) {
      const { error } = await client.auth.linkIdentity({
        provider,
        options: { redirectTo },
      });
      if (error) throw this.accountConflict(error);
      return;
    }
    const { error } = await client.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (error) throw translateAuthError(error);
  }

  private async guestSession(): Promise<boolean> {
    const { data, error } = await (await this.client()).auth.getSession();
    if (error) throw translateAuthError(error);
    return data.session?.user.is_anonymous === true;
  }

  private accountConflict(error: AuthError): Error {
    if (
      error.code === 'email_exists' ||
      error.code === 'user_already_exists' ||
      error.code === 'identity_already_exists'
    )
      return new AccountAlreadyExistsError();
    return translateAuthError(error);
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
      .select('first_name,last_name,organization')
      .eq('id', identity.user!.id)
      .maybeSingle<{
        first_name: string;
        last_name: string;
        organization: string;
      }>();
    if (error) throw new ServiceUnavailableError();
    return {
      firstName: data?.first_name ?? '',
      lastName: data?.last_name ?? '',
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
    const displayName = author.display_name.trim();
    const organization = author.organization.trim();
    return displayName || organization ? { displayName, organization } : null;
  }

  publish(request: PublicationRequest): Promise<PublicationReceipt> {
    return this.wirds.publish(request);
  }
  unlock(wirdId: string, code: string): Promise<Wird> {
    return this.wirds.unlock(wirdId, code);
  }
  setReminders(): Promise<never> {
    return Promise.reject(new ServiceUnavailableError());
  }
}
