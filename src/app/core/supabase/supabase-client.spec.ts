import { TestBed } from '@angular/core/testing';
import { ServiceUnavailableError } from '../services/frontend-gateway';
import { SUPABASE_AUTH_METHODS, SUPABASE_CONFIG } from './supabase-client';

describe('Supabase public Auth settings', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [
    { provide: SUPABASE_CONFIG, useValue: {
      url: 'https://project.example', publishableKey: 'test-publishable-key',
    } },
  ] }));

  it('uses only the publishable key and treats missing or non-boolean providers as disabled', async () => {
    const fetchSettings = spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify({
      external: { phone: true, google: 'true' },
    }), { status: 200 }));
    expect(await TestBed.inject(SUPABASE_AUTH_METHODS)()).toEqual({
      phone: true, google: false, apple: false,
    });
    expect(fetchSettings.calls.mostRecent().args[0]).toBe('https://project.example/auth/v1/settings');
    expect(fetchSettings.calls.mostRecent().args[1]?.headers).toEqual({ apikey: 'test-publishable-key' });
  });

  it('keeps unavailable settings closed on a network or server error', async () => {
    const fetchSettings = spyOn(window, 'fetch').and.rejectWith(new TypeError('Offline'));
    const methods = TestBed.inject(SUPABASE_AUTH_METHODS);
    await expectAsync(methods()).toBeRejectedWithError(ServiceUnavailableError);
    fetchSettings.and.resolveTo(new Response('{}', { status: 503 }));
    await expectAsync(methods()).toBeRejectedWithError(ServiceUnavailableError);
  });
});
