import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { WirdStore } from '../../../../core/wird-store';

describe('My grouped parts', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [WIRD_TEST_PROVIDER] }));
  beforeEach(() => {
    localStorage.removeItem('wirdlink.parts.v1');
    TestBed.configureTestingModule({ providers: appConfig.providers });
  });
  afterEach(() => localStorage.removeItem('wirdlink.parts.v1'));
  it('groups repeated participations and searches without altering totals', async () => {
    const store = TestBed.inject(WirdStore);
    for (const quantity of [200, 150, 10]) {
      const part = store.reserve('salat-nabi', quantity, 'Mamy');
      store.finish(part!.id);
    }
    store.reserve('salat-fatihi', 5, 'Awa');
    const harness = await RouterTestingHarness.create('/mes-parts');
    const cards = harness.routeNativeElement!.querySelectorAll('article');
    expect(cards.length).toBe(2);
    expect(cards[0].textContent).toContain('Pris');
    expect(cards[1].textContent).toContain('Terminé');
    expect(cards[1].textContent).toContain('360');
    const search = harness.routeNativeElement!.querySelector<HTMLInputElement>('#parts-search')!;
    search.value = 'mamy';
    search.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('article').length).toBe(1);
    expect(harness.routeNativeElement!.querySelector('article')?.textContent).toContain('360');
    search.value = 'inconnu';
    search.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('app-empty-state')?.textContent).toContain(
      'Aucun résultat',
    );
  });
});
