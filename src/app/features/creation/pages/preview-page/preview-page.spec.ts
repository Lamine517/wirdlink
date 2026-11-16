import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { I18nService } from '../../../../core/services/i18n';
import { CreationDraftStore } from '../../data-access/creation-draft';

describe('Translated publication preview', () => {
  beforeEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    localStorage.removeItem('wirdlink.language.v1');
  });
  afterEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    localStorage.removeItem('wirdlink.language.v1');
    document.documentElement.lang = 'fr';
    document.documentElement.dir = 'ltr';
  });

  for (const signedIn of [false, true]) {
    it(`translates recurrence, count and publication action with signedIn=${signedIn}`, async () => {
      const gateway = gatewayStub();
      gateway.restoreSession.and.resolveTo(signedIn ? { id: 'owner' } : null);
      TestBed.configureTestingModule({
        providers: [
          ...appConfig.providers,
          WIRD_TEST_PROVIDER,
          { provide: FRONTEND_GATEWAY, useValue: gateway },
        ],
      });
      const draft = TestBed.inject(CreationDraftStore);
      draft.updateContent({
        title: 'Mon texte personnel',
        target: 12222,
        description: 'Ma description',
      });
      const harness = await RouterTestingHarness.create('/creer/apercu');
      await harness.fixture.whenStable();
      const i18n = TestBed.inject(I18nService);
      for (const locale of ['en', 'ar'] as const) {
        i18n.setLocale(locale);
        harness.detectChanges();
        const page = harness.routeNativeElement!;
        expect(page.querySelector('.preview-publish')?.textContent?.trim()).toBe(
          i18n.translate(signedIn ? 'Publier' : 'Continuer pour publier'),
        );
        expect(page.querySelector('.text-strong')?.textContent?.trim()).toBe(
          i18n.translate('{count} lectures à partager', { count: 12222 }),
        );
        expect(page.querySelector('.preview-card > .text-secondary')?.textContent).toContain(
          i18n.translate('Une fois'),
        );
        expect(page.textContent).not.toContain('Continuer pour publier');
        expect(page.textContent).not.toContain('lectures à partager');
        expect(page.textContent).not.toContain('Une fois');
        expect(page.querySelector('h2')?.textContent).toBe('Mon texte personnel');
      }
    });
  }
});
