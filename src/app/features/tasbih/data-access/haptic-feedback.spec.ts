import { TestBed } from '@angular/core/testing';
import { HapticFeedback } from './haptic-feedback';

describe('Optional haptic feedback', () => {
  let original: PropertyDescriptor | undefined;
  beforeEach(() => {
    original = Object.getOwnPropertyDescriptor(navigator, 'vibrate');
  });
  afterEach(() => {
    if (original) Object.defineProperty(navigator, 'vibrate', original);
    else Reflect.deleteProperty(navigator, 'vibrate');
  });

  it('requests a short tap or a distinct goal pulse only when called', () => {
    const vibrate = jasmine.createSpy('vibrate').and.returnValue(true);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    const feedback = TestBed.inject(HapticFeedback);
    expect(vibrate).not.toHaveBeenCalled();
    feedback.tap();
    feedback.goal();
    expect(vibrate.calls.allArgs()).toEqual([[12], [[90, 60, 140]]]);
  });

  it('continues without an error on a browser without vibration support', () => {
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: undefined });
    const feedback = TestBed.inject(HapticFeedback);
    expect(feedback.supported).toBeFalse();
    expect(() => feedback.goal()).not.toThrow();
  });

  it('reports a refused vibration without throwing into the counting interaction', () => {
    const vibrate = jasmine.createSpy('vibrate').and.returnValue(false);
    Object.defineProperty(navigator, 'vibrate', { configurable: true, value: vibrate });
    const feedback = TestBed.inject(HapticFeedback);
    expect(() => feedback.goal()).not.toThrow();
    expect(feedback.unavailable()).toBeTrue();
  });
});
