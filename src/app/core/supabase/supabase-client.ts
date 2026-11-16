import { InjectionToken, NgZone, inject } from '@angular/core';
import type { SupabaseClient } from '@supabase/supabase-js';
import { ServiceUnavailableError } from '../services/frontend-gateway';

/** Browser credentials only. Authorization is enforced by Auth and database policies. */
export const SUPABASE_CONFIG = new InjectionToken('SUPABASE_CONFIG', {
  providedIn: 'root',
  factory: () => ({
    url: 'https://unhcqgwexwmxkwkwvgbl.supabase.co',
    publishableKey: 'sb_publishable_Ke6KpXG5kDz8Bw2aHq7pcw_LlH9RbXn',
  }),
});

export const SUPABASE_AUTH_METHODS = new InjectionToken<
  () => Promise<Readonly<Record<'phone' | 'google' | 'apple', boolean>>>
>('SUPABASE_AUTH_METHODS', {
  providedIn: 'root',
  factory: () => {
    const config = inject(SUPABASE_CONFIG);
    return async () => {
      try {
        const response = await fetch(config.url + '/auth/v1/settings', {
          headers: { apikey: config.publishableKey },
          signal: AbortSignal.timeout(10000),
        });
        if (!response.ok) throw new ServiceUnavailableError();
        const settings: { external?: Record<string, unknown> } = await response.json();
        return {
          phone: settings.external?.['phone'] === true,
          google: settings.external?.['google'] === true,
          apple: settings.external?.['apple'] === true,
        };
      } catch {
        throw new ServiceUnavailableError();
      }
    };
  },
});

export const SUPABASE_CLIENT = new InjectionToken<() => Promise<SupabaseClient>>(
  'SUPABASE_CLIENT',
  {
    providedIn: 'root',
    factory: () => {
      const config = inject(SUPABASE_CONFIG);
      const zone = inject(NgZone);
      let client: Promise<SupabaseClient> | undefined;
      return () => {
        client ??= zone.runOutsideAngular(() =>
          import('@supabase/supabase-js').then(({ createClient }) =>
            createClient(config.url, config.publishableKey, {
              auth: {
                flowType: 'pkce',
                detectSessionInUrl: false,
                persistSession: true,
                autoRefreshToken: true,
                storageKey: 'wirdlink.auth.v1',
              },
            }),
          ),
        );
        return client;
      };
    },
  },
);
