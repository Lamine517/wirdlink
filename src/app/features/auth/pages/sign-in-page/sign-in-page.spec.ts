import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY, InvalidCodeError } from '../../../../core/services/frontend-gateway';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../../creation/data-access/creation-draft';
import { AuthFlow, normalizePhone } from '../../data-access/auth-flow';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';

describe('Responsible sign-in screens', () => {
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

  function enter(harness: RouterTestingHarness, selector: string, value: string): void {
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
  }
  async function submit(harness: RouterTestingHarness): Promise<void> {
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
  }

  it('normalizes Senegalese numbers and rejects other country codes', () => {
    for (const phone of ['77 123 45 67', '+221771234567', '00221 77 123 45 67'])
      expect(normalizePhone(phone)).toBe('+221771234567');
    for (const phone of ['+33771234567', '77123', '711234567', 'letters'])
      expect(normalizePhone(phone)).toBeNull();
  });

  it('never pretends that a code was sent when the service is unavailable', async () => {
    const harness = await RouterTestingHarness.create('/connexion');
    enter(harness, '#auth-phone', '77 123 45 67');
    await submit(harness);
    expect(harness.routeNativeElement!.querySelector('#auth-code')).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Votre brouillon est conservé');
    expect(TestBed.inject(CreationDraftStore).hasDraft()).toBeTrue();
    expect(TestBed.inject(AuthFlow).session()).toBeNull();
  });

  it('shows OTP after send success, handles an incorrect code and returns to preview on success', async () => {
    gateway.requestCode.and.resolveTo();
    gateway.verifyCode.and.rejectWith(new InvalidCodeError());
    const harness = await RouterTestingHarness.create('/connexion');
    enter(harness, '#auth-phone', '77 123 45 67');
    await submit(harness);
    expect(gateway.requestCode).toHaveBeenCalledOnceWith('+221771234567');
    expect(harness.routeNativeElement!.textContent).toContain('Renvoyer dans');
    enter(harness, '#auth-code', '123456');
    await submit(harness);
    expect(harness.routeNativeElement!.textContent).toContain('Code incorrect ou expiré');
    expect(TestBed.inject(AuthFlow).session()).toBeNull();
    gateway.verifyCode.and.resolveTo({ id: 'responsible' });
    enter(harness, '#auth-code', '654321');
    await submit(harness);
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Votre aperçu');
    expect(harness.routeNativeElement!.querySelector('.preview-publish')?.textContent).toContain(
      'Publier',
    );
  });

  it('does not request a code for invalid numbers or resend while cooling down', async () => {
    gateway.requestCode.and.resolveTo();
    const harness = await RouterTestingHarness.create('/connexion');
    enter(harness, '#auth-phone', '123');
    await submit(harness);
    expect(gateway.requestCode).not.toHaveBeenCalled();
    enter(harness, '#auth-phone', '77 123 45 67');
    await submit(harness);
    expect(gateway.requestCode.calls.count()).toBe(1);
    await TestBed.inject(AuthFlow)
      .requestCode('77 123 45 67')
      .catch(() => undefined);
    expect(gateway.requestCode.calls.count()).toBe(1);
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
