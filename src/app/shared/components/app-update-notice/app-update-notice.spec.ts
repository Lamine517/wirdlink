import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppUpdates } from '../../../core/services/app-updates';
import { CreationDraftStore } from '../../../features/creation/data-access/creation-draft';
import { AppUpdateNotice } from './app-update-notice';

describe('Update notice and local media', () => {
  let reload: jasmine.Spy;
  const available = signal(true);
  const host = (fixture: { nativeElement: unknown }): HTMLElement => {
    if (!(fixture.nativeElement instanceof HTMLElement)) throw new Error('Missing host');
    return fixture.nativeElement;
  };
  beforeEach(() => {
    localStorage.removeItem('wirdlink.creation.v1');
    localStorage.removeItem('wirdlink.language.v1');
    available.set(true);
    reload = jasmine.createSpy('reload');
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    TestBed.configureTestingModule({ imports: [AppUpdateNotice], providers: [
      { provide: AppUpdates, useValue: { available, unrecoverable: signal(false), reloading: signal(false), reload } },
    ] });
  });
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));

  it('only reloads after an explicit user action when no local media is attached', () => {
    const fixture = TestBed.createComponent(AppUpdateNotice);
    fixture.detectChanges();
    expect(reload).not.toHaveBeenCalled();
    host(fixture).querySelector<HTMLButtonElement>('.update-notice button')!.click();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  for (const kind of ['image', 'audio'] as const) {
    it(`asks before losing a draft ${kind}, and cancellation keeps the file and text`, () => {
      const draft = TestBed.inject(CreationDraftStore);
      draft.updateContent({ title: 'Mon brouillon', description: 'Texte conservé', target: 100 });
      const file = new File(['example'], kind === 'image' ? 'image.png' : 'audio.mp3', { type: kind === 'image' ? 'image/png' : 'audio/mpeg' });
      expect(draft.setMedia(kind, file)).toBeTrue();
      const fixture = TestBed.createComponent(AppUpdateNotice);
      fixture.detectChanges();
      host(fixture).querySelector<HTMLButtonElement>('.update-notice button')!.click();
      fixture.detectChanges();
      expect(host(fixture).querySelector<HTMLDialogElement>('#app-update-confirmation')!.open).toBeTrue();
      expect(reload).not.toHaveBeenCalled();
      expect(fixture.nativeElement.textContent).toContain('vous devrez rattacher');
      host(fixture).querySelector<HTMLButtonElement>('#app-update-confirmation .button--outline')!.click();
      fixture.detectChanges();
      expect(reload).not.toHaveBeenCalled();
      expect(draft[kind]()?.file).toBe(file);
      expect(draft.draft().description).toBe('Texte conservé');
    });
  }

  it('reloads only after confirming the media warning and never discards the draft', () => {
    const draft = TestBed.inject(CreationDraftStore);
    draft.updateContent({ title: 'Mon brouillon', description: 'Texte conservé', target: 100 });
    draft.setMedia('image', new File(['x'], 'image.png', { type: 'image/png' }));
    const fixture = TestBed.createComponent(AppUpdateNotice);
    fixture.detectChanges();
    host(fixture).querySelector<HTMLButtonElement>('.update-notice button')!.click();
    fixture.detectChanges();
    host(fixture).querySelector<HTMLButtonElement>('#app-update-confirmation .button--primary')!.click();
    expect(reload).toHaveBeenCalledTimes(1);
    expect(draft.draft().title).toBe('Mon brouillon');
    expect(localStorage.getItem('wirdlink.creation.v1')).toContain('Texte conservé');
  });

  it('does not show a notice before a new version is available', () => {
    available.set(false);
    const fixture = TestBed.createComponent(AppUpdateNotice);
    fixture.detectChanges();
    expect(host(fixture).querySelector('.update-notice')).toBeNull();
    expect(reload).not.toHaveBeenCalled();
  });
});
