import { TEST_WIRDS } from '../testing/wird-fixtures.spec';
import { WirdStore } from './wird-store';

describe('WirdStore', () => {
  beforeEach(() => localStorage.removeItem('wirdlink.parts.v1'));
  afterEach(() => localStorage.removeItem('wirdlink.parts.v1'));

  it('starts empty and removes legacy demo data without touching other storage', () => {
    localStorage.setItem('wirdlink.demo.v1', JSON.stringify({ parts: [], name: 'Demo' }));
    const clear = spyOn(localStorage, 'clear');
    const store = new WirdStore();
    expect(store.wirds()).toEqual([]);
    expect(store.parts()).toEqual([]);
    expect(localStorage.getItem('wirdlink.demo.v1')).toBeNull();
    expect(clear).not.toHaveBeenCalled();
  });

  it('reserves once and finishes without decreasing the available count twice', () => {
    const store = new WirdStore(TEST_WIRDS);
    const part = store.reserve('salat-nabi', 10, 'Awa');
    expect(part).not.toBeNull();
    expect(store.available('salat-nabi')).toBe(390);
    expect(store.completed('salat-nabi')).toBe(600);
    expect(store.finish(part!.id)).toBeTrue();
    expect(store.available('salat-nabi')).toBe(390);
    expect(store.completed('salat-nabi')).toBe(610);
    expect(store.finish(part!.id)).toBeFalse();
    expect(store.completed('salat-nabi')).toBe(610);
  });

  it('rejects invalid quantities and reservations beyond the remaining total', () => {
    const store = new WirdStore(TEST_WIRDS);
    for (const quantity of [0, -1, 1.5, NaN, Infinity, 401]) {
      expect(store.reserve('salat-nabi', quantity, '')).toBeNull();
    }
    expect(store.reserve('missing', 1, '')).toBeNull();
    expect(store.reserve('salat-nabi', 400, '')).not.toBeNull();
    expect(store.reserve('salat-nabi', 1, '')).toBeNull();
    expect(store.available('salat-nabi')).toBe(0);
  });

  it('restores parts, completion and the selected name after reopening', () => {
    const store = new WirdStore(TEST_WIRDS);
    const part = store.reserve('salat-nabi', 10, ' Awa ');
    store.finish(part!.id);
    const restored = new WirdStore(TEST_WIRDS);
    expect(restored.savedName()).toBe('Awa');
    expect(restored.parts().length).toBe(1);
    expect(restored.completed('salat-nabi')).toBe(610);
    expect(restored.available('salat-nabi')).toBe(390);
  });

  it('ignores malformed or excessive saved reservations', () => {
    localStorage.setItem(
      'wirdlink.parts.v1',
      JSON.stringify({
        name: '',
        parts: [{ id: 'one', wirdId: 'salat-nabi', quantity: 401, name: '', finished: false }],
      }),
    );
    const store = new WirdStore(TEST_WIRDS);
    expect(store.parts()).toEqual([]);
    expect(store.storageWarning()).not.toBe('');
    expect(store.available('salat-nabi')).toBe(400);
  });

  it('keeps session state and warns when persistence fails', () => {
    spyOn(localStorage, 'setItem').and.throwError('Storage blocked');
    const store = new WirdStore(TEST_WIRDS);
    expect(store.reserve('salat-nabi', 10, '')).not.toBeNull();
    expect(store.parts().length).toBe(1);
    expect(store.storageWarning()).not.toBe('');
  });
  it('rejects duplicated identifiers and malformed saved parts', () => {
    const validPart = { id: 'one', wirdId: 'salat-nabi', quantity: 10, name: '', finished: false };
    const invalidCollections: unknown[][] = [
      [validPart, validPart],
      [null],
      [{ ...validPart, wirdId: 'missing' }],
      [{ ...validPart, quantity: 1.5 }],
    ];
    for (const parts of invalidCollections) {
      localStorage.setItem('wirdlink.parts.v1', JSON.stringify({ name: '', parts }));
      expect(new WirdStore(TEST_WIRDS).parts()).toEqual([]);
    }
    localStorage.setItem('wirdlink.parts.v1', '{broken');
    expect(new WirdStore(TEST_WIRDS).storageWarning()).not.toBe('');
  });
});
