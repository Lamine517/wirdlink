import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { WirdStore, Part } from '../../../../core/wird-store';
import { TasbihStore } from '../../data-access/tasbih-store';
import { HapticFeedback } from '../../data-access/haptic-feedback';

describe('Tasbih interaction', () => {
  let part: Part;
  let goal: jasmine.Spy;
  let tap: jasmine.Spy;
  beforeEach(() => {
    localStorage.removeItem('wirdlink.demo.v1');
    localStorage.removeItem('wirdlink.tasbih.v1');
    TestBed.configureTestingModule({ providers: appConfig.providers });
    part = TestBed.inject(WirdStore).reserve('salat-nabi', 3, 'Awa')!;
    const haptics = TestBed.inject(HapticFeedback);
    goal = spyOn(haptics, 'goal');
    tap = spyOn(haptics, 'tap');
  });
  afterEach(() => {
    localStorage.removeItem('wirdlink.demo.v1');
    localStorage.removeItem('wirdlink.tasbih.v1');
  });

  function click(harness: RouterTestingHarness, selector: string): void {
    harness.routeNativeElement!.querySelector<HTMLButtonElement>(selector)!.click();
    harness.detectChanges();
  }

  it('vibrates once on reaching the goal and requires an explicit final confirmation', async () => {
    const harness = await RouterTestingHarness.create('/mes-parts/' + part.id + '/compteur');
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.tasbih__finish')!.disabled,
    ).toBeTrue();
    for (let count = 0; count < 3; count++) click(harness, '.tasbih__circle');
    expect(harness.routeNativeElement!.querySelector('.tasbih__guidance')!.textContent).toContain(
      'Objectif atteint',
    );
    expect(goal).toHaveBeenCalledTimes(1);
    expect(tap).not.toHaveBeenCalled();
    expect(TestBed.inject(WirdStore).completed(part.wirdId)).toBe(600);
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.tasbih__circle')!.disabled,
    ).toBeTrue();
    click(harness, '.tasbih__circle');
    expect(goal).toHaveBeenCalledTimes(1);
    click(harness, '.tasbih__finish');
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(WirdStore).completed(part.wirdId)).toBe(603);
    expect(harness.routeNativeElement!.querySelector('h1')!.textContent).toBe('Merci !');
  });

  it('supports undo, an optional tap vibration and a confirmed reset without changing the collective count', async () => {
    const harness = await RouterTestingHarness.create('/mes-parts/' + part.id + '/compteur');
    TestBed.inject(TasbihStore).setHapticPreference('onTap', true);
    click(harness, '.tasbih__circle');
    click(harness, '.tasbih__circle');
    expect(tap).toHaveBeenCalledTimes(2);
    click(harness, '.tasbih__undo');
    expect(TestBed.inject(TasbihStore).count(part.id)).toBe(1);
    click(harness, '.tasbih-options');
    const buttons = () => [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('dialog button'),
    ];
    buttons()
      .find((button) => button.textContent?.includes('Remettre à zéro'))!
      .click();
    harness.detectChanges();
    expect(TestBed.inject(TasbihStore).count(part.id)).toBe(1);
    buttons()
      .find((button) => button.textContent?.includes('Garder le compteur'))!
      .click();
    harness.detectChanges();
    expect(TestBed.inject(TasbihStore).count(part.id)).toBe(1);
    buttons()
      .find((button) => button.textContent?.includes('Remettre à zéro'))!
      .click();
    harness.detectChanges();
    buttons()
      .find((button) => button.textContent?.includes('Recommencer à zéro'))!
      .click();
    harness.detectChanges();
    expect(TestBed.inject(TasbihStore).count(part.id)).toBe(0);
    expect(TestBed.inject(WirdStore).completed(part.wirdId)).toBe(600);
    expect(TestBed.inject(WirdStore).parts()[0].finished).toBeFalse();
  });

  it('keeps the personal counter available offline but refuses final confirmation', async () => {
    const harness = await RouterTestingHarness.create('/mes-parts/' + part.id + '/compteur');
    spyOnProperty(navigator, 'onLine', 'get').and.returnValue(false);
    window.dispatchEvent(new Event('offline'));
    for (let count = 0; count < 3; count++) click(harness, '.tasbih__circle');
    expect(TestBed.inject(TasbihStore).count(part.id)).toBe(3);
    expect(
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.tasbih__finish')!.disabled,
    ).toBeTrue();
    expect(TestBed.inject(WirdStore).parts()[0].finished).toBeFalse();
  });

  it('handles missing and already finished shares without an active counter', async () => {
    const harness = await RouterTestingHarness.create('/mes-parts/missing/compteur');
    expect(harness.routeNativeElement!.textContent).toContain('Part introuvable');
    expect(harness.routeNativeElement!.querySelector('.tasbih__circle')).toBeNull();
    TestBed.inject(WirdStore).finish(part.id);
    await harness.navigateByUrl('/mes-parts/' + part.id + '/compteur');
    expect(harness.routeNativeElement!.textContent).toContain('Cette part est terminée');
    expect(harness.routeNativeElement!.querySelector('.tasbih__circle')).toBeNull();
  });
  it('still vibrates on the last tap when per-tap feedback is enabled and the goal pulse is off', async () => {
    const counter = TestBed.inject(TasbihStore);
    counter.setHapticPreference('onTap', true);
    counter.setHapticPreference('atGoal', false);
    const harness = await RouterTestingHarness.create('/mes-parts/' + part.id + '/compteur');
    for (let count = 0; count < 3; count++) click(harness, '.tasbih__circle');
    expect(tap).toHaveBeenCalledTimes(3);
    expect(goal).not.toHaveBeenCalled();
    expect(TestBed.inject(WirdStore).parts()[0].finished).toBeFalse();
  });
});
