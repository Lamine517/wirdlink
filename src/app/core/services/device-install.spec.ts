import { TestBed } from '@angular/core/testing';
import { DeviceInstall } from './device-install';

describe('Device installation invitation', () => {
  it('never prompts automatically and allows a declined invitation', async () => {
    const service = TestBed.inject(DeviceInstall);
    const event = new Event('beforeinstallprompt', { cancelable: true });
    const prompt = jasmine.createSpy('prompt').and.resolveTo({ outcome: 'dismissed' });
    Object.assign(event, { prompt });
    window.dispatchEvent(event);
    expect(event.defaultPrevented).toBeTrue();
    expect(service.available()).toBeTrue();
    expect(prompt).not.toHaveBeenCalled();
    await service.install();
    expect(prompt).toHaveBeenCalledTimes(1);
    expect(service.available()).toBeFalse();
    expect(service.installed()).toBeFalse();
    expect(service.message()).toContain('plus tard');
  });
});
