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
    expect(isContentValid({ title: 'Wird', description: '', target: 2147483647 })).toBeTrue();
    for (const target of [null, 0, -1, 1.5, Infinity, 2147483648, Number.MAX_SAFE_INTEGER + 1]) {
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
    expect(
      store.setMedia('audio', new File(['voice'], 'voice.m4a', { type: 'audio/x-m4a' })),
    ).toBeTrue();
    expect(
      store.setMedia('audio', new File(['aac'], 'voice.aac', { type: 'audio/aac' })),
    ).toBeFalse();
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

describe('Optional creation texts', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('preserves distinct description and opening instructions, and accepts both empty', () => {
    const store = TestBed.inject(CreationDraftStore);
    store.updateContent({
      title: 'Notre wird',
      target: 12000,
      description: 'Pour notre famille',
      instructions: 'Fatiha ×1\nSalatoul Fatihi ×7\nAstaghfiroullah ×100',
    });
    TestBed.resetTestingModule();
    const restored = TestBed.inject(CreationDraftStore);
    expect(restored.draft().description).toBe('Pour notre famille');
    expect(restored.draft().instructions).toContain('Fatiha ×1\n');
    expect(restored.draft().target).toBe(12000);
    expect(
      isContentValid({ title: 'Notre wird', target: 12000, description: '', instructions: '' }),
    ).toBeTrue();
    expect(
      isContentValid({
        title: 'Notre wird',
        target: 12000,
        description: '',
        instructions: 'x'.repeat(1001),
      }),
    ).toBeFalse();
  });
  it('restores old drafts with no instructions field', () => {
    localStorage.setItem(
      'wirdlink.creation.v1',
      JSON.stringify({
        title: 'Ancien brouillon',
        target: 1000,
        description: 'Message existant',
        recurrence: 'Une fois',
        startDate: todayDate(),
        endDate: '',
        visibility: 'public',
      }),
    );
    const store = TestBed.inject(CreationDraftStore);
    expect(store.draft().instructions).toBe('');
    expect(store.draft().description).toBe('Message existant');
    expect(store.warning()).toBe('');
  });
});

describe('Attachment boundaries', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('rejects an empty audio file instead of displaying a player that cannot play', () => {
    const store = TestBed.inject(CreationDraftStore);
    expect(store.setMedia('audio', new File([], 'empty.wav', { type: 'audio/wav' }))).toBeFalse();
    expect(store.audio()).toBeNull();
    expect(store.mediaError()).not.toBe('');
  });
});

describe('An unfinished draft with optional text', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  afterEach(() => localStorage.removeItem('wirdlink.creation.v1'));
  it('can be resumed even when it only contains opening instructions', () => {
    const draft = TestBed.inject(CreationDraftStore);
    draft.updateContent({ title: '', target: null, description: '', instructions: 'Fatiha ×1' });
    expect(draft.hasDraft()).toBeTrue();
    TestBed.resetTestingModule();
    expect(TestBed.inject(CreationDraftStore).hasDraft()).toBeTrue();
  });
});
