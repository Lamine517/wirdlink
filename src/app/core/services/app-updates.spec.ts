import { ApplicationRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { SwUpdate, UnrecoverableStateEvent, VersionEvent } from '@angular/service-worker';
import { BehaviorSubject, Subject } from 'rxjs';
import { APP_RELOAD, AppUpdates } from './app-updates';

describe('Application updates', () => {
  let stable: BehaviorSubject<boolean>;
  let versions: Subject<VersionEvent>;
  let failures: Subject<UnrecoverableStateEvent>;
  let check: jasmine.Spy;
  let activate: jasmine.Spy;
  let reload: jasmine.Spy;

  beforeEach(() => {
    stable = new BehaviorSubject(false);
    versions = new Subject();
    failures = new Subject();
    check = jasmine.createSpy('checkForUpdate').and.resolveTo(false);
    activate = jasmine.createSpy('activateUpdate');
    reload = jasmine.createSpy('reload');
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(true);
    TestBed.configureTestingModule({ providers: [
      { provide: ApplicationRef, useValue: { isStable: stable } },
      { provide: APP_RELOAD, useValue: reload },
      { provide: SwUpdate, useValue: { isEnabled: true, versionUpdates: versions, unrecoverable: failures, checkForUpdate: check, activateUpdate: activate } },
    ] });
  });

  function ready(): void {
    versions.next({ type: 'VERSION_READY', currentVersion: { hash: 'old' }, latestVersion: { hash: 'new' } });
  }

  it('offers an available version without activating or reloading it automatically', () => {
    const updates = TestBed.inject(AppUpdates);
    ready();
    expect(updates.available()).toBeTrue();
    expect(updates.unrecoverable()).toBeFalse();
    expect(reload).not.toHaveBeenCalled();
    expect(activate).not.toHaveBeenCalled();
    updates.reload();
    updates.reload();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(activate).not.toHaveBeenCalled();
  });

  it('offers an explicit reload when a running version is unrecoverable', () => {
    const updates = TestBed.inject(AppUpdates);
    failures.next({ type: 'UNRECOVERABLE_STATE', reason: 'missing chunk' });
    expect(updates.available()).toBeTrue();
    expect(updates.unrecoverable()).toBeTrue();
    expect(reload).not.toHaveBeenCalled();
  });

  it('waits for stability, deduplicates checks and throttles focus and online retries', async () => {
    let resolveCheck: (value: boolean) => void = () => undefined;
    check.and.returnValue(new Promise<boolean>((resolve) => resolveCheck = resolve));
    const now = spyOn(Date, 'now').and.returnValue(1_000);
    TestBed.inject(AppUpdates);
    window.dispatchEvent(new Event('focus'));
    expect(check).not.toHaveBeenCalled();
    stable.next(true);
    expect(check).toHaveBeenCalledTimes(1);
    now.and.returnValue(62_000);
    window.dispatchEvent(new Event('focus'));
    window.dispatchEvent(new Event('online'));
    expect(check).toHaveBeenCalledTimes(1);
    resolveCheck(false);
    await Promise.resolve();
    check.and.resolveTo(false);
    window.dispatchEvent(new Event('online'));
    expect(check).toHaveBeenCalledTimes(2);
    await Promise.resolve();
    window.dispatchEvent(new Event('focus'));
    expect(check).toHaveBeenCalledTimes(2);
  });

  it('catches a rejected check and retries on a later reconnection', async () => {
    const now = spyOn(Date, 'now').and.returnValue(1_000);
    check.and.rejectWith(new Error('Offline'));
    const updates = TestBed.inject(AppUpdates);
    stable.next(true);
    await Promise.resolve();
    expect(updates.available()).toBeFalse();
    now.and.returnValue(62_000);
    check.and.resolveTo(false);
    await updates.checkForUpdate();
    expect(check).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
  });

  it('does not check offline and removes listeners and subscriptions on teardown', () => {
    const remove = spyOn(window, 'removeEventListener').and.callThrough();
    const updates = TestBed.inject(AppUpdates);
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('focus', jasmine.any(Function));
    expect(remove).toHaveBeenCalledWith('online', jasmine.any(Function));
    ready();
    stable.next(true);
    window.dispatchEvent(new Event('focus'));
    expect(updates.available()).toBeFalse();
    expect(check).not.toHaveBeenCalled();
  });

  it('stays inert without a service worker provider', async () => {
    TestBed.overrideProvider(SwUpdate, { useValue: null });
    const updates = TestBed.inject(AppUpdates);
    stable.next(true);
    await updates.checkForUpdate();
    updates.reload();
    expect(updates.available()).toBeFalse();
    expect(check).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('stays inert when service workers are disabled in development', async () => {
    TestBed.overrideProvider(SwUpdate, { useValue: { isEnabled: false } });
    const updates = TestBed.inject(AppUpdates);
    stable.next(true);
    await updates.checkForUpdate();
    expect(check).not.toHaveBeenCalled();
    expect(updates.available()).toBeFalse();
  });
});
