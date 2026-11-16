import { I18nService } from '../../../../core/services/i18n';
import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';

describe('Device preferences frontend', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  afterEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    sessionStorage.removeItem('wirdlink.auth.return');
    TestBed.inject(I18nService).setLocale('fr');
    localStorage.removeItem('wirdlink.language.v1');
  });
  it('changes the existing interface and reading direction from the language controls', async () => {
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gatewayStub() }],
    });
    const harness = await RouterTestingHarness.create('/preferences');
    const arabic = harness.routeNativeElement!.querySelector<HTMLInputElement>(
      'input[name="language"][value="ar"]',
    )!;
    arabic.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('الإعدادات');
    expect(document.documentElement.dir).toBe('rtl');
    expect(localStorage.getItem('wirdlink.language.v1')).toBe('ar');
  });

  it('keeps reminders off when the service is unavailable and leaves help reachable', async () => {
    const gateway = gatewayStub();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    const harness = await RouterTestingHarness.create('/preferences');
    expect(harness.routeNativeElement!.textContent).toContain(
      'La veille d’un nouveau cycle, une notification rappelle que l’objectif recommence.',
    );
    expect(gateway.setReminders).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.querySelector('a[href="/aide"]')).not.toBeNull();
  });

  it('shows a publish sign-in banner only while no account is open', async () => {
    const gateway = gatewayStub();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    const harness = await RouterTestingHarness.create('/preferences');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const banner = harness.routeNativeElement!.querySelector('.publish-banner');
    expect(banner?.textContent).toContain('Connectez-vous pour publier votre wird.');
    const link = banner?.querySelector('a');
    expect(link?.classList.contains('button--accent')).toBeTrue();
    expect(link?.getAttribute('href')).toBe('/connexion');
    expect(link?.textContent).toContain('Continuer pour publier');
    link?.click();
    expect(sessionStorage.getItem('wirdlink.auth.return')).toBe('/preferences');

    gateway.restoreSession.and.resolveTo({ id: 'responsible', displayName: 'Aminata Ndiaye' });
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] });
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    const signedIn = await RouterTestingHarness.create('/preferences');
    await signedIn.fixture.whenStable();
    signedIn.detectChanges();
    expect(signedIn.routeNativeElement!.querySelector('.publish-banner')).toBeNull();
  });
});
