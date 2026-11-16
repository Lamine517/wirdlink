import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { FRONTEND_GATEWAY } from '../../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../../testing/frontend-gateway.spec';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../../creation/data-access/creation-draft';
import { AuthFlow } from '../../../auth/data-access/auth-flow';

describe('Publication and mobile sharing screens', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  beforeEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('shows success and private code only after an approved publication, with a copy action', async () => {
    const gateway = gatewayStub();
    gateway.requestCode.and.resolveTo();
    gateway.verifyCode.and.resolveTo({ id: 'responsible' });
    gateway.publish.and.resolveTo({
      id: 'new-private',
      title: 'Salat ala Nabi',
      visibility: 'private',
      shareUrl: window.location.origin + '/wird/new-private',
      accessCode: '0876',
    });
    TestBed.configureTestingModule({
      providers: [...appConfig.providers, { provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    const draft = TestBed.inject(CreationDraftStore);
    draft.chooseTemplate(WIRD_TEMPLATES[0]);
    draft.updateSchedule({ ...draft.draft(), visibility: 'private' });
    const auth = TestBed.inject(AuthFlow);
    await auth.requestCode('771234567');
    await auth.verifyCode('123456');
    const harness = await RouterTestingHarness.create('/creer/apercu');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.preview-publish')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('C’est fait !');
    expect(harness.routeNativeElement!.querySelector('.share-page__code')?.textContent).toContain(
      '0876',
    );
    const clipboard = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    [...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Copier le code'))!
      .click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(clipboard).toHaveBeenCalledOnceWith('0876');
    expect(harness.routeNativeElement!.textContent).toContain('Code copié');
    expect(draft.hasDraft()).toBeFalse();
  });
  it('does not invent a successful publication when the confirmation page is opened directly', async () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const harness = await RouterTestingHarness.create('/partage');
    expect(harness.routeNativeElement!.textContent).toContain('Lien indisponible');
    expect(harness.routeNativeElement!.textContent).not.toContain('C’est fait');
  });
});
