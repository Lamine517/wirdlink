import { TestBed } from '@angular/core/testing';
import { InstallApp } from './install-app';

describe('Home install invitation', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.install.dismissed'));
  afterEach(() => localStorage.removeItem('wirdlink.install.dismissed'));

  it('stays hidden after the invitation is closed', () => {
    const fixture = TestBed.createComponent(InstallApp);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.install-button')).not.toBeNull();
    host.querySelector<HTMLButtonElement>('.install-dismiss')!.click();
    fixture.detectChanges();
    expect(host.querySelector('.install-button')).toBeNull();
    expect(localStorage.getItem('wirdlink.install.dismissed')).toBe('1');

    const again = TestBed.createComponent(InstallApp);
    again.detectChanges();
    expect((again.nativeElement as HTMLElement).querySelector('.install-button')).toBeNull();
  });
});
