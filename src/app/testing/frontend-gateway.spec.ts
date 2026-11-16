import { FrontendGateway, ServiceUnavailableError } from '../core/services/frontend-gateway';

export function gatewayStub(): jasmine.SpyObj<FrontendGateway> {
  const stub = jasmine.createSpyObj<FrontendGateway>('FrontendGateway', [
    'requestCode',
    'verifyCode',
    'signInWithProvider',
    'completeSignIn',
    'publish',
    'unlock',
    'setReminders',
  ]);
  for (const method of [
    stub.requestCode,
    stub.verifyCode,
    stub.signInWithProvider,
    stub.completeSignIn,
    stub.publish,
    stub.unlock,
    stub.setReminders,
  ]) {
    method.and.callFake((): Promise<never> => Promise.reject(new ServiceUnavailableError()));
  }
  return stub;
}
