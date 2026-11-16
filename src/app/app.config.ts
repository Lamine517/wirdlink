import { TranslatedTitle } from './core/services/translated-title';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import {
  ApplicationConfig,
  LOCALE_ID,
  isDevMode,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter, TitleStrategy, withInMemoryScrolling } from '@angular/router';

import { routes } from './app.routes';
import { FRONTEND_GATEWAY } from './core/services/frontend-gateway';
import { WIRD_REPOSITORY } from './core/services/wird-repository';
import { SupabaseWirdRepository } from './core/supabase/supabase-wird-repository';
import { SupabaseAuthGateway } from './core/supabase/supabase-auth-gateway';
import { provideServiceWorker } from '@angular/service-worker';

registerLocaleData(localeFr);

export const appConfig: ApplicationConfig = {
  providers: [
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:3000',
    }),
    { provide: FRONTEND_GATEWAY, useExisting: SupabaseAuthGateway },
    { provide: WIRD_REPOSITORY, useExisting: SupabaseWirdRepository },
    { provide: TitleStrategy, useClass: TranslatedTitle },
    { provide: LOCALE_ID, useValue: 'fr' },
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes, withInMemoryScrolling({ scrollPositionRestoration: 'top' })),
  ],
};
