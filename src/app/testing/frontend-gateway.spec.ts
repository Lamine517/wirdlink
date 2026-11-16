import { FrontendGateway, ServiceUnavailableError } from '../core/services/frontend-gateway';

export function gatewayStub(): jasmine.SpyObj<FrontendGateway> {
  const stub = jasmine.createSpyObj<FrontendGateway>('FrontendGateway', [
    'restoreSession',
    'watchSession',
    'signOut',
    'deleteAccount',
    'loadProfile',
    'saveProfile',
    'loadWirdAuthor',
    'requestCode',
    'verifyCode',
    'signInWithProvider',
    'signInWithEmail',
    'completeSignIn',
    'publish',
    'unlock',
    'setReminders',
  ]);
  stub.restoreSession.and.resolveTo(null);
  stub.watchSession.and.returnValue(() => undefined);
  for (const method of [
    stub.requestCode,
    stub.verifyCode,
    stub.signInWithProvider,
    stub.signInWithEmail,
    stub.completeSignIn,
    stub.publish,
    stub.unlock,
    stub.setReminders,
    stub.signOut,
    stub.deleteAccount,
    stub.loadProfile,
    stub.saveProfile,
    stub.loadWirdAuthor,
  ]) {
    method.and.callFake((): Promise<never> => Promise.reject(new ServiceUnavailableError()));
  }
  return stub;
}
