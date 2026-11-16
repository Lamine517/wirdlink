import { TestBed } from '@angular/core/testing';
import { FRONTEND_GATEWAY, PublicationReceipt } from '../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../testing/frontend-gateway.spec';
import { CreationDraftStore, WIRD_TEMPLATES } from '../../creation/data-access/creation-draft';
import { AuthFlow } from '../../auth/data-access/auth-flow';
import { PublicationFlow } from './publication-flow';

describe('Publication confirmation boundary', () => {
  let gateway: ReturnType<typeof gatewayStub>;
  const receipt: PublicationReceipt = {
    id: 'published',
    title: 'Salat ala Nabi',
    visibility: 'public',
    shareUrl: window.location.origin + '/wird/published',
  };
  beforeEach(async () => {
    localStorage.removeItem('wirdlink.creation.v1');
    gateway = gatewayStub();
    gateway.requestCode.and.resolveTo();
    gateway.verifyCode.and.resolveTo({ id: 'responsible' });
    TestBed.configureTestingModule({
      providers: [{ provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    TestBed.inject(CreationDraftStore).chooseTemplate(WIRD_TEMPLATES[0]);
    const auth = TestBed.inject(AuthFlow);
    await auth.requestCode('771234567');
    await auth.verifyCode('123456');
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));

  it('keeps all draft data on failure and reuses the idempotency key on retry', async () => {
    const flow = TestBed.inject(PublicationFlow);
    const draft = TestBed.inject(CreationDraftStore);
    draft.updateContent({
      title: 'Salat ala Nabi',
      target: 1000,
      description: 'Pour la famille',
      instructions: 'Fatiha ×1',
    });
    await expectAsync(flow.publish()).toBeRejected();
    expect(draft.draft().instructions).toBe('Fatiha ×1');
    expect(flow.receipt()).toBeNull();
    gateway.publish.and.resolveTo(receipt);
    expect(await flow.publish()).toBeTrue();
    expect(gateway.publish.calls.allArgs()[0][0].requestId).toBe(
      gateway.publish.calls.allArgs()[1][0].requestId,
    );
    expect(flow.receipt()).toEqual(receipt);
    expect(draft.hasDraft()).toBeFalse();
  });

  it('ignores simultaneous attempts and rejects a foreign share URL without clearing the draft', async () => {
    let resolve!: (receipt: PublicationReceipt) => void;
    gateway.publish.and.returnValue(new Promise((result) => (resolve = result)));
    const flow = TestBed.inject(PublicationFlow);
    const first = flow.publish();
    expect(await flow.publish()).toBeFalse();
    resolve({ ...receipt, shareUrl: 'https://example.com/wird/published' });
    await expectAsync(first).toBeRejected();
    expect(gateway.publish.calls.count()).toBe(1);
    expect(TestBed.inject(CreationDraftStore).hasDraft()).toBeTrue();
  });
  it('preserves a newer draft if an earlier publication finishes after the user edits it', async () => {
    let resolve!: (value: PublicationReceipt) => void;
    gateway.publish.and.returnValue(new Promise((result) => (resolve = result)));
    const flow = TestBed.inject(PublicationFlow);
    const draft = TestBed.inject(CreationDraftStore);
    const publishing = flow.publish();
    draft.updateContent({
      title: 'Un nouveau wird',
      target: 500,
      description: 'Autre description',
      instructions: 'Autres consignes',
    });
    resolve(receipt);
    expect(await publishing).toBeTrue();
    expect(draft.draft().title).toBe('Un nouveau wird');
    expect(draft.draft().instructions).toBe('Autres consignes');
  });
});
