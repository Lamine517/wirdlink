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

  it('offers Google and email while keeping telephone unavailable', async () => {
    const harness = await RouterTestingHarness.create('/connexion');
    expect(harness.routeNativeElement!.querySelector('#auth-phone')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('input[type="email"]')).not.toBeNull();
    expect(
      harness
        .routeNativeElement!.querySelector<HTMLButtonElement>('#auth-email-tab')!
        .getAttribute('aria-selected'),
    ).toBe('true');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('#auth-phone-tab')!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Bientôt disponible');
    expect(harness.routeNativeElement!.querySelector('.auth-soon app-icon')).not.toBeNull();
    expect(harness.routeNativeElement!.querySelector('input[type="email"]')).toBeNull();
    expect(harness.routeNativeElement!.textContent).not.toContain('Apple');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.auth-google')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(gateway.signInWithProvider).toHaveBeenCalledOnceWith('google');
    expect(gateway.requestCode).not.toHaveBeenCalled();
    expect(harness.routeNativeElement!.textContent).toContain('votre brouillon est conservé');
  });

  it('validates email and sends a link without granting a session', async () => {
    gateway.signInWithEmail.and.resolveTo();
    const harness = await RouterTestingHarness.create('/connexion');
    const email = harness.routeNativeElement!.querySelector<HTMLInputElement>('#auth-email')!;
    const submit =
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(submit.disabled).toBeTrue();
    email.value = 'not-an-email';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
    expect(submit.disabled).toBeTrue();
    email.value = 'awa@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
    expect(submit.disabled).toBeFalse();
    submit.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(gateway.signInWithEmail).toHaveBeenCalledOnceWith('awa@example.com');
    expect(TestBed.inject(AuthFlow).session()).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Consultez votre boîte mail');
    expect(TestBed.inject(CreationDraftStore).hasDraft()).toBeTrue();
  });

  it('keeps the email form and draft after a rejected link request', async () => {
    gateway.signInWithEmail.and.rejectWith(new Error('Unavailable'));
    const harness = await RouterTestingHarness.create('/connexion');
    const email = harness.routeNativeElement!.querySelector<HTMLInputElement>('#auth-email')!;
    email.value = 'awa@example.com';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    harness.detectChanges();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('#auth-email')).not.toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Le lien n’a pas pu être envoyé');
    expect(TestBed.inject(CreationDraftStore).hasDraft()).toBeTrue();
    expect(TestBed.inject(AuthFlow).session()).toBeNull();
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
