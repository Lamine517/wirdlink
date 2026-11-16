import { TestBed } from '@angular/core/testing';
import { WirdStore } from '../../../core/wird-store';
import { TasbihStore } from './tasbih-store';

const COUNTER_KEY = 'wirdlink.tasbih.v1';

describe('Personal counter for a reserved share', () => {
  beforeEach(() => {
    localStorage.removeItem('wirdlink.demo.v1');
    localStorage.removeItem(COUNTER_KEY);
  });
  afterEach(() => {
    localStorage.removeItem('wirdlink.demo.v1');
    localStorage.removeItem(COUNTER_KEY);
  });

  it('counts within the reserved goal without updating collective completion', () => {
    const wirds = TestBed.inject(WirdStore);
    const part = wirds.reserve('salat-nabi', 3, 'Awa')!;
    const counter = TestBed.inject(TasbihStore);
    for (let tap = 0; tap < 3; tap++) expect(counter.increment(part.id)).toBeTrue();
    expect(counter.increment(part.id)).toBeFalse();
    expect(counter.count(part.id)).toBe(3);
    expect(wirds.completed('salat-nabi')).toBe(600);
    expect(wirds.available('salat-nabi')).toBe(397);
    counter.undo(part.id);
    expect(counter.count(part.id)).toBe(2);
    counter.reset(part.id);
    expect(counter.count(part.id)).toBe(0);
    counter.undo(part.id);
    expect(counter.count(part.id)).toBe(0);
    expect(wirds.parts()[0].finished).toBeFalse();
  });

  it('restores independent counts and vibration preferences on the same device', () => {
    const wirds = TestBed.inject(WirdStore);
    const first = wirds.reserve('salat-nabi', 10, '')!;
    const second = wirds.reserve('salat-nabi', 20, '')!;
    const counter = TestBed.inject(TasbihStore);
    counter.increment(first.id);
    counter.increment(first.id);
    counter.increment(second.id);
    counter.setHapticPreference('atGoal', false);
    counter.setHapticPreference('onTap', true);
    TestBed.resetTestingModule();
    const restored = TestBed.inject(TasbihStore);
    expect(restored.count(first.id)).toBe(2);
    expect(restored.count(second.id)).toBe(1);
    expect(restored.haptics()).toEqual({ atGoal: false, onTap: true });
  });

  it('rejects saved counts beyond the reserved quantity while preserving the reservation', () => {
    const part = TestBed.inject(WirdStore).reserve('salat-nabi', 10, '')!;
    localStorage.setItem(
      COUNTER_KEY,
      JSON.stringify({
        version: 1,
        counts: [[part.id, 11]],
        haptics: { atGoal: true, onTap: false },
      }),
    );
    const counter = TestBed.inject(TasbihStore);
    expect(counter.count(part.id)).toBe(0);
    expect(counter.warning()).not.toBe('');
    expect(TestBed.inject(WirdStore).parts()[0].quantity).toBe(10);
  });

  it('does not count unknown or finished shares and tolerates unavailable storage', () => {
    const wirds = TestBed.inject(WirdStore);
    const part = wirds.reserve('salat-nabi', 1, '')!;
    const counter = TestBed.inject(TasbihStore);
    expect(counter.increment('unknown')).toBeFalse();
    spyOn(localStorage, 'setItem').and.throwError('Blocked');
    expect(counter.increment(part.id)).toBeTrue();
    expect(counter.warning()).toContain('Sauvegarde indisponible');
    wirds.finish(part.id);
    expect(counter.increment(part.id)).toBeFalse();
  });
});
