import { DEFAULT_TEMPLATES } from '../../../core/config/app-config';
import { TestBed } from '@angular/core/testing';
import { FRONTEND_GATEWAY, PublicationReceipt } from '../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../testing/frontend-gateway.spec';
import { CreationDraftStore } from '../../creation/data-access/creation-draft';
import { AuthFlow } from '../../auth/data-access/auth-flow';
import { WirdStore } from '../../../core/wird-store';
import { PublicationFlow } from './publication-flow';

describe('Publication confirmation boundary', () => {
  let gateway: ReturnType<typeof gatewayStub>;
  async function waitForPublication(): Promise<void> {
    for (let attempt = 0; attempt < 100 && !gateway.publish.calls.count(); attempt++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 1));
    }
    expect(gateway.publish).toHaveBeenCalled();
  }
  const receipt: PublicationReceipt = {
    id: 'published',
    title: 'Salat ala Nabi',
    visibility: 'public',
    shareUrl: window.location.origin + '/wird/published',
  };
  beforeEach(async () => {
    localStorage.removeItem('wirdlink.creation.v1');
    localStorage.removeItem('wirdlink.publication-request.v1');
    gateway = gatewayStub();
    gateway.requestCode.and.resolveTo();
    gateway.verifyCode.and.resolveTo({ id: 'responsible' });
    TestBed.configureTestingModule({
      providers: [{ provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
    TestBed.inject(CreationDraftStore).chooseTemplate(DEFAULT_TEMPLATES[0]);
    const auth = TestBed.inject(AuthFlow);
    await auth.requestCode('771234567');
    await auth.verifyCode('123456');
  });
  afterEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    localStorage.removeItem('wirdlink.publication-request.v1');
  });

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

  it('restores the same request after flow recreation and preserves the draft when read-back fails', async () => {
    const first = TestBed.inject(PublicationFlow);
    await expectAsync(first.publish()).toBeRejected();
    const firstId = gateway.publish.calls.mostRecent().args[0].requestId;
    const metadata = JSON.parse(localStorage.getItem('wirdlink.publication-request.v1')!);
    expect(metadata.fingerprint).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(metadata)).not.toContain('Salat');
    const restored = TestBed.runInInjectionContext(() => new PublicationFlow());
    gateway.publish.and.resolveTo(receipt);
    const ensure = spyOn(TestBed.inject(WirdStore), 'ensure').and.rejectWith(new Error('Offline'));
    await expectAsync(restored.publish()).toBeRejected();
    expect(gateway.publish.calls.mostRecent().args[0].requestId).toBe(firstId);
    expect(ensure).toHaveBeenCalledOnceWith('published');
    expect(TestBed.inject(CreationDraftStore).hasDraft()).toBeTrue();
  });

  it('ignores simultaneous attempts and rejects a foreign share URL without clearing the draft', async () => {
    let resolve!: (receipt: PublicationReceipt) => void;
    gateway.publish.and.returnValue(new Promise((result) => (resolve = result)));
    const flow = TestBed.inject(PublicationFlow);
    const first = flow.publish();
    expect(await flow.publish()).toBeFalse();
    await waitForPublication();
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
    await waitForPublication();
    resolve(receipt);
    expect(await publishing).toBeTrue();
    expect(draft.draft().title).toBe('Un nouveau wird');
    expect(draft.draft().instructions).toBe('Autres consignes');
  });
});
