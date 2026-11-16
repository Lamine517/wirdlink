import { TestBed } from '@angular/core/testing';
import { FRONTEND_GATEWAY, ResponsibleSession } from '../../../core/services/frontend-gateway';
import { gatewayStub } from '../../../testing/frontend-gateway.spec';
import { AuthFlow } from './auth-flow';

describe('Responsible session lifecycle', () => {
  let gateway: ReturnType<typeof gatewayStub>;
  beforeEach(() => {
    gateway = gatewayStub();
    TestBed.configureTestingModule({
      providers: [{ provide: FRONTEND_GATEWAY, useValue: gateway }],
    });
  });

  it('restores a session after reload without requesting another code', async () => {
    gateway.restoreSession.and.resolveTo({ id: 'responsible' });
    const flow = TestBed.inject(AuthFlow);
    expect(flow.restoring()).toBeTrue();
    await flow.ready;
    expect(flow.session()).toEqual({ id: 'responsible' });
    expect(flow.restoring()).toBeFalse();
    expect(gateway.requestCode).not.toHaveBeenCalled();
  });

  it('does not overwrite a newer verified sign-in with a delayed restoration', async () => {
    let resolve!: (value: ResponsibleSession | null) => void;
    gateway.restoreSession.and.returnValue(new Promise((result) => (resolve = result)));
    gateway.requestCode.and.resolveTo();
    gateway.verifyCode.and.resolveTo({ id: 'new-session' });
    const flow = TestBed.inject(AuthFlow);
    await flow.requestCode('771234567');
    await flow.verifyCode('123456');
    resolve(null);
    await flow.ready;
    expect(flow.session()).toEqual({ id: 'new-session' });
  });

  it('clears the identity on a sign-out event and unsubscribes on destruction', async () => {
    let notify!: (session: ResponsibleSession | null) => void;
    const stop = jasmine.createSpy('stop');
    gateway.watchSession.and.callFake((listener) => {
      notify = listener;
      return stop;
    });
    gateway.restoreSession.and.resolveTo({ id: 'responsible' });
    const flow = TestBed.inject(AuthFlow);
    await flow.ready;
    notify(null);
    expect(flow.session()).toBeNull();
    TestBed.resetTestingModule();
    expect(stop).toHaveBeenCalledTimes(1);
  });

  it('never grants a session after a failed restore', async () => {
    gateway.restoreSession.and.rejectWith(new Error('Offline'));
    const flow = TestBed.inject(AuthFlow);
    await flow.ready;
    expect(flow.session()).toBeNull();
    expect(flow.restoring()).toBeFalse();
  });
  it('delegates an email link request without creating a session', async () => {
    gateway.signInWithEmail.and.resolveTo();
    const flow = TestBed.inject(AuthFlow);
    await flow.ready;
    await flow.email('awa@example.com');
    expect(gateway.signInWithEmail).toHaveBeenCalledOnceWith('awa@example.com', false);
    expect(flow.session()).toBeNull();
  });
});
