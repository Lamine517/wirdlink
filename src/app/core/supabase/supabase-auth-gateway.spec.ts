import { TestBed } from '@angular/core/testing';
import { AuthApiError, Session, SupabaseClient, User } from '@supabase/supabase-js';
import {
  InvalidCodeError,
  RateLimitError,
  ServiceUnavailableError,
} from '../services/frontend-gateway';
import type { PublicationRequest } from '../services/frontend-gateway';
import { SupabaseWirdRepository } from './supabase-wird-repository';
import { SUPABASE_AUTH_METHODS, SUPABASE_CLIENT } from './supabase-client';
import { SupabaseAuthGateway, translateAuthError } from './supabase-auth-gateway';

function user(anonymous = false): User {
  return {
    id: 'responsible',
    aud: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: '2026-11-16T00:00:00Z',
    is_anonymous: anonymous,
  };
}
function session(): Session {
  return {
    access_token: 'test-access',
    refresh_token: 'test-refresh',
    expires_in: 3600,
    token_type: 'bearer',
    user: user(),
  };
}

describe('Supabase authentication adapter', () => {
  let auth: jasmine.SpyObj<SupabaseClient['auth']>;
  let gateway: SupabaseAuthGateway;
  let methods: jasmine.Spy;
  let invoke: jasmine.Spy;
  let repository: jasmine.SpyObj<Pick<SupabaseWirdRepository, 'publish' | 'unlock'>>;

  beforeEach(() => {
    auth = jasmine.createSpyObj<SupabaseClient['auth']>('auth', [
      'getSession',
      'getUser',
      'signInWithOtp',
      'verifyOtp',
      'signInWithOAuth',
      'linkIdentity',
      'updateUser',
      'exchangeCodeForSession',
      'signOut',
      'onAuthStateChange',
    ]);
    methods = jasmine
      .createSpy('methods')
      .and.resolveTo({ phone: true, google: true, apple: true });
    invoke = jasmine.createSpy('invoke');
    repository = jasmine.createSpyObj('repository', ['publish', 'unlock']);
    TestBed.configureTestingModule({
      providers: [
        {
          provide: SUPABASE_CLIENT,
          useValue: () => Promise.resolve({ auth, functions: { invoke } }),
        },
        { provide: SUPABASE_AUTH_METHODS, useValue: methods },
        { provide: SupabaseWirdRepository, useValue: repository },
      ],
    });
    auth.getSession.and.resolveTo({ data: { session: null }, error: null });
    gateway = TestBed.inject(SupabaseAuthGateway);
  });

  it('restores only identities verified with Auth, excluding anonymous participants', async () => {
    auth.getSession.and.resolveTo({ data: { session: null }, error: null });
    expect(await gateway.restoreSession()).toBeNull();
    expect(auth.getUser).not.toHaveBeenCalled();
    auth.getSession.and.resolveTo({ data: { session: session() }, error: null });
    auth.getUser.and.resolveTo({ data: { user: user(true) }, error: null });
    expect(await gateway.restoreSession()).toBeNull();
    auth.getUser.and.resolveTo({ data: { user: user() }, error: null });
    expect(await gateway.restoreSession()).toEqual({ id: 'responsible' });
    auth.getUser.and.resolveTo({
      data: { user: null },
      error: new AuthApiError('Expired', 401, undefined),
    });
    await expectAsync(gateway.restoreSession()).toBeRejectedWithError(ServiceUnavailableError);
  });

  it('does not send SMS or leave the page for disabled providers', async () => {
    methods.and.resolveTo({ phone: false, google: false, apple: false });
    await expectAsync(gateway.requestCode('+221771234567')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
    await expectAsync(gateway.signInWithProvider('google')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
    await expectAsync(gateway.signInWithProvider('apple')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
  });

  it('uses phone OTP and accepts only a permanent verified identity', async () => {
    auth.signInWithOtp.and.resolveTo({ data: { user: null, session: null }, error: null });
    await gateway.requestCode('+221771234567');
    expect(auth.signInWithOtp).toHaveBeenCalledOnceWith({
      phone: '+221771234567',
      options: { channel: 'sms' },
    });
    auth.verifyOtp.and.resolveTo({ data: { user: user(), session: session() }, error: null });
    expect(await gateway.verifyCode('+221771234567', '123456')).toEqual({ id: 'responsible' });
    expect(auth.verifyOtp).toHaveBeenCalledWith({
      phone: '+221771234567',
      token: '123456',
      type: 'sms',
    });
    auth.verifyOtp.and.resolveTo({ data: { user: user(true), session: session() }, error: null });
    await expectAsync(gateway.verifyCode('+221771234567', '123456')).toBeRejectedWithError(
      ServiceUnavailableError,
    );
  });

  it('links a guest session instead of replacing it', async () => {
    const guest = session();
    guest.user = user(true);
    auth.getSession.and.resolveTo({ data: { session: guest }, error: null });
    auth.linkIdentity.and.resolveTo({
      data: { provider: 'google', url: 'https://example.com' },
      error: null,
    } as never);
    await gateway.signInWithProvider('google');
    expect(auth.linkIdentity).toHaveBeenCalledOnceWith({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/connexion/retour' },
    } as never);
    expect(auth.signInWithOAuth).not.toHaveBeenCalled();
    auth.updateUser.and.resolveTo({ data: { user: user(true) }, error: null });
    await gateway.signInWithEmail('awa@example.com');
    expect(auth.updateUser).toHaveBeenCalledOnceWith(
      { email: 'awa@example.com' },
      { emailRedirectTo: window.location.origin + '/connexion/retour' },
    );
    expect(auth.signInWithOtp).not.toHaveBeenCalled();
    auth.linkIdentity.calls.reset();
    auth.signInWithOAuth.and.resolveTo({
      data: { provider: 'google', url: 'https://example.com' },
      error: null,
    });
    await gateway.signInWithProvider('google', true);
    expect(auth.signInWithOAuth).toHaveBeenCalled();
    expect(auth.linkIdentity).not.toHaveBeenCalled();
  });

  it('uses a fixed same-origin OAuth callback and exchanges the PKCE code', async () => {
    auth.signInWithOAuth.and.resolveTo({
      data: { provider: 'google', url: 'https://example.com' },
      error: null,
    });
    await gateway.signInWithProvider('google');
    expect(auth.signInWithOAuth).toHaveBeenCalledOnceWith({
      provider: 'google',
      options: { redirectTo: window.location.origin + '/connexion/retour' },
    });
    auth.exchangeCodeForSession.and.resolveTo({
      data: { user: user(), session: session() },
      error: null,
    });
    expect(await gateway.completeSignIn('test-pkce-code')).toEqual({ id: 'responsible' });
    expect(auth.exchangeCodeForSession).toHaveBeenCalledOnceWith('test-pkce-code');
  });

  it('maps rate limits and OTP errors without exposing raw messages', () => {
    expect(
      translateAuthError(new AuthApiError('Private provider detail', 429, undefined)),
    ).toBeInstanceOf(RateLimitError);
    expect(translateAuthError(new AuthApiError('Expired', 403, 'otp_expired'))).toBeInstanceOf(
      InvalidCodeError,
    );
    expect(
      translateAuthError(new AuthApiError('Private provider detail', 500, undefined)).message,
    ).not.toContain('Private');
  });

  it('cleans up the observer even when destroyed before SDK initialization', async () => {
    const stop = gateway.watchSession(jasmine.createSpy('listener'));
    stop();
    await Promise.resolve();
    expect(auth.onAuthStateChange).not.toHaveBeenCalled();
  });

  it('ignores initial storage, observes sign-out and releases the SDK subscription', async () => {
    const unsubscribe = jasmine.createSpy('unsubscribe');
    let notify!: (event: 'INITIAL_SESSION' | 'SIGNED_OUT', value: Session | null) => void;
    auth.onAuthStateChange.and.callFake((callback) => {
      notify = callback;
      return { data: { subscription: { id: 'test', callback, unsubscribe } } };
    });
    const listener = jasmine.createSpy('listener');
    const stop = gateway.watchSession(listener);
    await Promise.resolve();
    notify('INITIAL_SESSION', session());
    expect(listener).not.toHaveBeenCalled();
    notify('SIGNED_OUT', null);
    expect(listener).toHaveBeenCalledOnceWith(null);
    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });

  it('signs out this device and keeps reminders unavailable', async () => {
    auth.signOut.and.resolveTo({ error: null });
    await gateway.signOut();
    expect(auth.signOut).toHaveBeenCalledOnceWith({ scope: 'local' });
    await expectAsync(gateway.setReminders()).toBeRejectedWithError(ServiceUnavailableError);
  });

  it('delegates publication and private access to the real repository', async () => {
    const request: PublicationRequest = {
      requestId: 'request',
      image: null,
      audio: null,
      draft: {
        title: 'Salat',
        description: '',
        target: 1000,
        recurrence: 'Une fois',
        visibility: 'public',
        startDate: '2026-11-16',
        endDate: '',
      },
    };
    const receipt = {
      id: 'wird',
      title: 'Salat',
      visibility: 'public' as const,
      shareUrl: 'https://example.com/wird/wird',
    };
    repository.publish.and.resolveTo(receipt);
    expect(await gateway.publish(request)).toBe(receipt);
    expect(repository.publish).toHaveBeenCalledOnceWith(request);
    repository.unlock.and.rejectWith(new InvalidCodeError());
    await expectAsync(gateway.unlock('wird', '123456')).toBeRejectedWithError(InvalidCodeError);
    expect(repository.unlock).toHaveBeenCalledOnceWith('wird', '123456');
    expect(auth.getUser).not.toHaveBeenCalled();
  });

  it('clears the local session only after confirmed server-side account deletion', async () => {
    invoke.and.resolveTo({ data: { deleted: false }, error: null });
    await expectAsync(gateway.deleteAccount()).toBeRejectedWithError(ServiceUnavailableError);
    expect(auth.signOut).not.toHaveBeenCalled();
    invoke.and.resolveTo({ data: { deleted: true }, error: null });
    auth.signOut.and.resolveTo({ error: null });
    await gateway.deleteAccount();
    expect(invoke).toHaveBeenCalledWith('delete-account', {
      body: { confirmation: 'DELETE_ACCOUNT' },
    });
    expect(auth.signOut).toHaveBeenCalledOnceWith({ scope: 'local' });
  });
});
