import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../../creation/data-access/creation-draft';
import { AuthFlow } from '../../data-access/auth-flow';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';

describe('Responsible sign-in screens', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  let gateway: ReturnType<typeof gatewayStub>;
  beforeEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    gateway = gatewayStub();
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    TestBed.inject(CreationDraftStore).chooseTemplate(WIRD_TEMPLATES[0]);
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));

  it('offers Google only and marks phone and email as coming soon', async () => {
    const harness = await RouterTestingHarness.create('/connexion');
    expect(harness.routeNativeElement!.querySelector('#auth-phone')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('input[type="email"]')).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Bientôt disponible');
    expect(harness.routeNativeElement!.textContent).not.toContain('Apple');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.auth-google')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(gateway.signInWithProvider).toHaveBeenCalledOnceWith('google');
    expect(gateway.requestCode).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.textContent).toContain('Votre brouillon est conservé');
  });

  it('removes callback parameters and returns to the fixed preview route', async () => {
    const history = spyOn(window.history, 'replaceState').and.stub();
    gateway.completeSignIn.and.resolveTo({ id: 'responsible' });
    const harness = await RouterTestingHarness.create(
      '/connexion/retour?code=test-callback&next=https://example.com',
    );
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(history.calls.argsFor(0).slice(1)).toEqual(['', '/connexion/retour']);
    expect(gateway.completeSignIn).toHaveBeenCalledOnceWith('test-callback');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Votre aperçu');
  });
});
