import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { WirdHeader } from './wird-header';

describe('Native wird sharing', () => {
  const originalShare = Object.getOwnPropertyDescriptor(navigator, 'share');
  const originalCanShare = Object.getOwnPropertyDescriptor(navigator, 'canShare');
  let share: jasmine.Spy;

  beforeEach(() => {
    share = jasmine.createSpy('share').and.resolveTo();
    Object.defineProperty(navigator, 'share', { configurable: true, value: share });
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true });
    TestBed.configureTestingModule({ imports: [WirdHeader], providers: [provideRouter([])] });
  });
  afterEach(() => {
    for (const [name, descriptor] of [['share', originalShare], ['canShare', originalCanShare]] as const) {
      if (descriptor) Object.defineProperty(navigator, name, descriptor);
      else Reflect.deleteProperty(navigator, name);
    }
  });

  function setup() {
    const fixture = TestBed.createComponent(WirdHeader);
    fixture.componentRef.setInput('title', 'Notre wird');
    fixture.componentRef.setInput('shareLink', '/partage/example');
    fixture.componentRef.setInput('shareUrl', 'https://wirdlink.vercel.app/wird/example');
    fixture.detectChanges();
    const navigate = spyOn(TestBed.inject(Router), 'navigateByUrl').and.resolveTo(true);
    const button = fixture.nativeElement.querySelector('.wird-header__share') as HTMLButtonElement;
    return { fixture, navigate, button };
  }

  it('opens the native sheet with the canonical wird URL', async () => {
    const { fixture, navigate, button } = setup();
    button.click();
    await fixture.whenStable();
    expect(share).toHaveBeenCalledOnceWith({ title: 'Notre wird', url: 'https://wirdlink.vercel.app/wird/example' });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('does nothing else when the user cancels the native share sheet', async () => {
    share.and.rejectWith(new DOMException('Cancelled', 'AbortError'));
    const { fixture, navigate, button } = setup();
    button.click();
    await fixture.whenStable();
    expect(navigate).not.toHaveBeenCalled();
    expect(button.disabled).toBeFalse();
  });

  it('keeps the existing sharing page when native sharing is unavailable or fails', async () => {
    share.and.rejectWith(new DOMException('Unavailable', 'NotAllowedError'));
    const { fixture, navigate, button } = setup();
    button.click(); await fixture.whenStable();
    expect(navigate).toHaveBeenCalledOnceWith('/partage/example');
    navigate.calls.reset();
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    button.click(); await fixture.whenStable();
    expect(navigate).toHaveBeenCalledOnceWith('/partage/example');
  });
});
