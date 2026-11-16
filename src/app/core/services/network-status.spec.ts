import { TestBed } from '@angular/core/testing';
import { NetworkStatus } from './network-status';

describe('Network state', () => {
  it('reacts to browser connectivity events and removes listeners on teardown', () => {
    const remove = spyOn(window, 'removeEventListener').and.callThrough();
    const state = TestBed.inject(NetworkStatus);
    const online = spyOnProperty(navigator, 'onLine', 'get');
    online.and.returnValue(false);
    window.dispatchEvent(new Event('offline'));
    expect(state.online()).toBeFalse();
    online.and.returnValue(true);
    window.dispatchEvent(new Event('online'));
    expect(state.online()).toBeTrue();
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('offline', jasmine.any(Function));
    expect(remove).toHaveBeenCalledWith('online', jasmine.any(Function));
  });
});
