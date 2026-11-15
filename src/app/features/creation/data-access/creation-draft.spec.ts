import { TestBed } from '@angular/core/testing';
import {
  CreationDraftStore,
  WIRD_TEMPLATES,
  isContentValid,
  isScheduleValid,
  todayDate,
} from './creation-draft';

describe('Creation draft', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));

  it('restores edited text and schedule without persisting media', () => {
    const store = TestBed.inject(CreationDraftStore);
    store.chooseTemplate(WIRD_TEMPLATES[0]);
    store.updateContent({
      title: 'Pour ma famille',
      description: 'Vendredi ensemble',
      target: 500,
    });
    store.updateSchedule({
      recurrence: 'Chaque vendredi',
      startDate: '2099-05-01',
      endDate: '',
      visibility: 'private',
    });
    store.setMedia('image', new File(['image'], 'photo.png', { type: 'image/png' }));
    TestBed.resetTestingModule();
    const restored = TestBed.inject(CreationDraftStore);
    expect(restored.draft().title).toBe('Pour ma famille');
    expect(restored.draft().target).toBe(500);
    expect(restored.draft().visibility).toBe('private');
    expect(restored.image()).toBeNull();
  });

  it('rejects malformed saved data and reports storage failure', () => {
    localStorage.setItem('wirdlink.creation.v1', '{broken');
    const store = TestBed.inject(CreationDraftStore);
    expect(store.hasDraft()).toBeFalse();
    expect(store.warning()).not.toBe('');
    spyOn(localStorage, 'setItem').and.throwError('Storage unavailable');
    store.chooseTemplate(WIRD_TEMPLATES[4]);
    expect(store.warning()).toContain('indisponible');
  });

  it('checks content, real calendar dates and date ordering', () => {
    expect(isContentValid({ title: 'Wird', description: '', target: 1000 })).toBeTrue();
    for (const target of [null, 0, -1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
      expect(isContentValid({ title: 'Wird', description: '', target })).toBeFalse();
    }
    expect(isContentValid({ title: '   ', description: '', target: 10 })).toBeFalse();
    const schedule = {
      recurrence: 'Une fois' as const,
      startDate: todayDate(),
      endDate: '',
      visibility: 'public' as const,
    };
    expect(isScheduleValid(schedule)).toBeTrue();
    expect(isScheduleValid({ ...schedule, startDate: '2099-02-31' })).toBeFalse();
    expect(
      isScheduleValid({ ...schedule, startDate: '2099-02-02', endDate: '2099-02-01' }),
    ).toBeFalse();
    expect(isScheduleValid({ ...schedule, startDate: '2000-01-01' })).toBeFalse();
  });

  it('validates local attachments and releases replaced media URLs', () => {
    const store = TestBed.inject(CreationDraftStore);
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    expect(
      store.setMedia('image', new File(['svg'], 'photo.svg', { type: 'image/svg+xml' })),
    ).toBeFalse();
    expect(store.image()).toBeNull();
    expect(
      store.setMedia('image', new File(['png'], 'photo.png', { type: 'image/png' })),
    ).toBeTrue();
    const firstUrl = store.image()!.url;
    expect(
      store.setMedia('image', new File(['jpg'], 'other.jpg', { type: 'image/jpeg' })),
    ).toBeTrue();
    expect(revoke).toHaveBeenCalledWith(firstUrl);
    expect(
      store.setMedia('audio', new File(['audio'], 'voice.webm', { type: 'audio/webm' })),
    ).toBeTrue();
    store.chooseTemplate(WIRD_TEMPLATES[1]);
    expect(store.image()).toBeNull();
    expect(store.audio()).toBeNull();
  });
  it('discards the draft and releases its attachments', () => {
    const store = TestBed.inject(CreationDraftStore);
    store.chooseTemplate(WIRD_TEMPLATES[0]);
    store.setMedia('audio', new File(['audio'], 'voice.webm', { type: 'audio/webm' }));
    const url = store.audio()!.url;
    const revoke = spyOn(URL, 'revokeObjectURL').and.callThrough();
    store.discard();
    expect(store.hasDraft()).toBeFalse();
    expect(store.audio()).toBeNull();
    expect(revoke).toHaveBeenCalledWith(url);
    expect(localStorage.getItem('wirdlink.creation.v1')).toBeNull();
  });
});
