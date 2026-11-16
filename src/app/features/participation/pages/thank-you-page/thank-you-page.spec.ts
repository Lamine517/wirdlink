import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { WirdStore } from '../../../../core/wird-store';

describe('Reading confirmation', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  beforeEach(() => {
    localStorage.removeItem('wirdlink.parts.v1');
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });
  afterEach(() => localStorage.removeItem('wirdlink.parts.v1'));

  it('distinguishes reserved parts from a completed objective', async () => {
    const store = TestBed.inject(WirdStore);
    const part = store.reserve('salat-nabi', 400, '');
    const harness = await RouterTestingHarness.create('/merci/salat-nabi');
    expect(harness.routeNativeElement!.textContent).toContain('Toutes les parts sont prises.');
    expect(harness.routeNativeElement!.textContent).not.toContain('Objectif atteint');
    expect(
      harness
        .routeNativeElement!.querySelector('[role="progressbar"]')
        ?.getAttribute('aria-valuenow'),
    ).toBe('600');
    store.finish(part!.id);
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Objectif atteint !');
    expect(
      harness
        .routeNativeElement!.querySelector('[role="progressbar"]')
        ?.getAttribute('aria-valuenow'),
    ).toBe('1000');
    expect(harness.routeNativeElement!.querySelector('a[href="/wird/salat-nabi"]')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('a[href="/"]')).not.toBeNull();
  });

  it('offers a recovery link when the wird cannot be found', async () => {
    const harness = await RouterTestingHarness.create('/merci/inconnu');
    expect(harness.routeNativeElement!.textContent).toContain('Wird introuvable');
    expect(harness.routeNativeElement!.querySelector('a[href="/"]')).not.toBeNull();
  });
});
