import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../../creation/data-access/creation-draft';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';

describe('Profile and account actions', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  let gateway: ReturnType<typeof gatewayStub>;
  beforeEach(() => {
    gateway = gatewayStub();
    gateway.restoreSession.and.resolveTo({ id: 'responsible', displayName: 'Aminata Ndiaye' });
    gateway.loadProfile.and.resolveTo({
      firstName: 'Aminata',
      lastName: 'Ndiaye',
      organization: '',
    });
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  async function profile() {
    const harness = await RouterTestingHarness.create('/profil');
    await harness.fixture.whenStable();
    harness.detectChanges();
    return harness;
  }

  it('separates the yellow avatar/profile from settings and saves optional organization', async () => {
    const harness = await RouterTestingHarness.create('/');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('.account-link')?.getAttribute('href')).toBe(
      '/profil',
    );
    expect(harness.routeNativeElement!.querySelector('app-user-avatar')?.textContent).toBe('A');
    expect(harness.routeNativeElement!.querySelector('.settings-link')?.getAttribute('href')).toBe(
      '/preferences',
    );
    await harness.navigateByUrl('/preferences');
    expect(harness.routeNativeElement!.textContent).not.toContain('Se déconnecter');
    await harness.navigateByUrl('/profil');
    await harness.fixture.whenStable();
    harness.detectChanges();
    gateway.saveProfile.and.resolveTo();
    const input =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('#profile-organization')!;
    input.value = 'Dahira du quartier';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(gateway.saveProfile).toHaveBeenCalledWith({
      firstName: 'Aminata',
      lastName: 'Ndiaye',
      organization: 'Dahira du quartier',
    });
    expect(harness.routeNativeElement!.textContent).toContain('Profil enregistré');
  });

  it('requires confirmation and preserves the identity/draft on deletion failure', async () => {
    const draft = TestBed.inject(CreationDraftStore);
    draft.chooseTemplate(WIRD_TEMPLATES[0]);
    const harness = await profile();
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.profile-delete')!.click();
    harness.detectChanges();
    expect(gateway.deleteAccount).not.toHaveBeenCalled();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('#delete-account .button--danger')!
      .click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('La suppression n’est pas terminée');
    expect(TestBed.inject(AuthFlow).session()).not.toBeNull();
    expect(draft.hasDraft()).toBeTrue();
    gateway.deleteAccount.and.resolveTo();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('#delete-account .button--danger')!
      .click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(AuthFlow).session()).toBeNull();
    expect(draft.hasDraft()).toBeFalse();
    expect(harness.routeNativeElement!.textContent).toContain('Votre compte a été supprimé');
  });

  it('signs out from the profile while retaining an unpublished draft', async () => {
    const draft = TestBed.inject(CreationDraftStore);
    draft.chooseTemplate(WIRD_TEMPLATES[0]);
    gateway.signOut.and.resolveTo();
    const harness = await profile();
    const button = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('button'),
    ].find((button) => button.textContent?.includes('Se déconnecter'))!;
    button.click();
    harness.detectChanges();
    expect(gateway.signOut).not.toHaveBeenCalled();
    expect(TestBed.inject(AuthFlow).session()).not.toBeNull();
    expect(
      harness.routeNativeElement!.querySelector<HTMLDialogElement>('#sign-out')!.open,
    ).toBeTrue();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('#sign-out .button--primary')!
      .click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(AuthFlow).session()).toBeNull();
    expect(draft.hasDraft()).toBeTrue();
    expect(harness.routeNativeElement!.textContent).toContain('Vous êtes déconnecté');
  });
  it('retains the session when sign-out confirmation is cancelled', async () => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    const harness = await profile();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('.profile-actions > .button--outline')!
      .click();
    harness.detectChanges();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('#sign-out .button--outline')!
      .click();
    harness.detectChanges();
    expect(
      harness.routeNativeElement!.querySelector<HTMLDialogElement>('#sign-out')!.open,
    ).toBeFalse();
    expect(gateway.signOut).not.toHaveBeenCalled();
    expect(TestBed.inject(AuthFlow).session()).not.toBeNull();
  });
});
