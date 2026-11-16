import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../../creation/data-access/creation-draft';

describe('Device preferences frontend', () => {
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('shows sign-out for a restored session and retains local drafts after signing out', async () => {
    const gateway = gatewayStub();
    gateway.restoreSession.and.resolveTo({ id: 'responsible' });
    gateway.signOut.and.resolveTo();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    const draft = TestBed.inject(CreationDraftStore);
    draft.chooseTemplate(WIRD_TEMPLATES[0]);
    const harness = await RouterTestingHarness.create('/preferences');
    await harness.fixture.whenStable();
    harness.detectChanges();
    const button = [...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('button')]
      .find((item) => item.textContent?.includes('Se déconnecter'))!;
    expect(button).toBeDefined();
    button.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(gateway.signOut).toHaveBeenCalledTimes(1);
    expect(draft.hasDraft()).toBeTrue();
    expect(harness.routeNativeElement!.textContent).not.toContain('Se déconnecter');
  });
  it('keeps reminders off when the service is unavailable and leaves help reachable', async () => {
    const gateway = gatewayStub();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    const harness = await RouterTestingHarness.create('/preferences');
    const button = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('button'),
    ].find((item) => item.textContent?.includes('Activer les rappels'));
    if (button) {
      button.click();
      await harness.fixture.whenStable();
      harness.detectChanges();
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(harness.routeNativeElement!.textContent).toContain('Aucun rappel n’a été activé');
    }
    expect(harness.routeNativeElement!.querySelector('a[href="/aide"]')).not.toBeNull();
  });
});
