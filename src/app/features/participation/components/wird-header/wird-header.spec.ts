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
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    TestBed.configureTestingModule({ imports: [WirdHeader], providers: [provideRouter([])] });
  });
  afterEach(() => {
    for (const [name, descriptor] of [
      ['share', originalShare],
      ['canShare', originalCanShare],
    ] as const) {
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

  it('gives participants a direct share button and owners the full options menu', async () => {
    const { fixture, button } = setup();
    expect(button.getAttribute('aria-label')).toBe('Partager');
    button.click();
    await fixture.whenStable();
    expect(share).toHaveBeenCalled();
    fixture.componentRef.setInput('canManage', true);
    fixture.componentRef.setInput('allowDuplicate', true);
    fixture.detectChanges();
    const menuButton = fixture.nativeElement.querySelector(
      '.wird-header__share',
    ) as HTMLButtonElement;
    expect(menuButton.getAttribute('aria-label')).toBe('Plus d’options');
    menuButton.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('dialog').open).toBeTrue();
    const menuText = fixture.nativeElement.querySelector('.wird-menu').textContent;
    expect(menuText).toContain('Modifier');
    expect(menuText).toContain('Dupliquer');
    expect(menuText).toContain('Supprimer');
  });

  it('opens the native sheet with the canonical wird URL', async () => {
    const { fixture, navigate, button } = setup();
    button.click();
    await fixture.whenStable();
    expect(share).toHaveBeenCalledOnceWith({
      title: 'Notre wird',
      url: 'https://wirdlink.vercel.app/wird/example',
    });
    expect(navigate).not.toHaveBeenCalled();
  });

  it('sends the owner of a private wird to the page that shows its access code', async () => {
    const { fixture, navigate, button } = setup();
    fixture.componentRef.setInput('accessCode', true);
    fixture.detectChanges();
    button.click();
    await fixture.whenStable();
    expect(share).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledOnceWith('/partage/example');
  });

  it('does nothing else when the user cancels the native share sheet', async () => {
    share.and.rejectWith(new DOMException('Cancelled', 'AbortError'));
    const { fixture, navigate, button } = setup();
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(navigate).not.toHaveBeenCalled();
    expect(button.disabled).toBeFalse();
  });

  it('keeps the existing sharing page when native sharing is unavailable or fails', async () => {
    share.and.rejectWith(new DOMException('Unavailable', 'NotAllowedError'));
    const { fixture, navigate, button } = setup();
    button.click();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledOnceWith('/partage/example');
    navigate.calls.reset();
    Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
    button.click();
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledOnceWith('/partage/example');
  });
});
