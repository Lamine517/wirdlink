import { TestBed } from '@angular/core/testing';
import { Appearance } from './appearance';

describe('Automatic and explicit appearance', () => {
  let listener: ((event: MediaQueryListEvent) => void) | undefined;
  let remove: jasmine.Spy;
  beforeEach(() => {
    localStorage.removeItem('wirdlink.theme.v1');
    remove = jasmine.createSpy('removeEventListener');
    const media = {
      matches: false,
      addEventListener: (_type: string, callback: (event: MediaQueryListEvent) => void) =>
        (listener = callback),
      removeEventListener: remove,
    };
    spyOn(window, 'matchMedia').and.returnValue(media as unknown as MediaQueryList);
  });
  afterEach(() => {
    localStorage.removeItem('wirdlink.theme.v1');
    delete document.documentElement.dataset['theme'];
    document.documentElement.style.colorScheme = '';
  });

  it('follows device changes in automatic mode and preserves a manual override', () => {
    const appearance = TestBed.inject(Appearance);
    expect(appearance.resolved()).toBe('light');
    listener!({ matches: true } as MediaQueryListEvent);
    expect(document.documentElement.dataset['theme']).toBe('dark');
    appearance.setPreference('light');
    listener!({ matches: true } as MediaQueryListEvent);
    expect(appearance.resolved()).toBe('light');
    expect(localStorage.getItem('wirdlink.theme.v1')).toBe('light');
    appearance.setPreference('auto');
    expect(appearance.resolved()).toBe('dark');
  });

  it('restores an explicit preference and keeps it active even when persistence fails', () => {
    localStorage.setItem('wirdlink.theme.v1', 'dark');
    const appearance = TestBed.inject(Appearance);
    expect(appearance.resolved()).toBe('dark');
    spyOn(localStorage, 'setItem').and.throwError('Blocked');
    appearance.setPreference('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
    expect(appearance.warning()).toContain('cette session');
    TestBed.resetTestingModule();
    expect(remove).toHaveBeenCalledWith('change', jasmine.any(Function));
  });
});
