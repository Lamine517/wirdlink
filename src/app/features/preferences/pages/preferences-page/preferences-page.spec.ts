import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';

describe('Device preferences frontend', () => {
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
