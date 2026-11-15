import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';

describe('WirdLink navigation', () => {
  beforeEach(() => {
    localStorage.removeItem('wirdlink.demo.v1');
    TestBed.configureTestingModule({ imports: [App], providers: appConfig.providers });
  });
  afterEach(() => localStorage.removeItem('wirdlink.demo.v1'));

  it('offers the three main destinations and identifies demo data', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('nav a').length).toBe(3);
    expect(element.textContent).toContain('Démonstration');
  });

  it('takes a part and completes it through the participant screens', async () => {
    const harness = await RouterTestingHarness.create('/wird/salat-nabi');
    const form = harness.routeNativeElement!.querySelector('form')!;
    const input = form.querySelector<HTMLInputElement>('#quantity')!;
    input.value = '10';
    input.dispatchEvent(new Event('input'));
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('10 à lire');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('article button')!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Merci !');
    expect(harness.routeNativeElement!.textContent).toContain('390');
  });

  it('shows an empty result for completed wirds and handles unknown links', async () => {
    const harness = await RouterTestingHarness.create('/');
    const buttons = harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>(
      '.segmented-control button',
    );
    buttons[1].click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.textContent).toContain('Aucun wird ici');
    await harness.navigateByUrl('/wird/inconnu');
    expect(harness.routeNativeElement!.textContent).toContain('Wird introuvable');
  });
  it('explains invalid input without creating a part', async () => {
    const harness = await RouterTestingHarness.create('/wird/salat-nabi');
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!;
    input.value = '401';
    input.dispatchEvent(new Event('input'));
    harness.routeNativeElement!.querySelector('form')!.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true }),
    );
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')?.textContent).toContain('entre 1 et 400');
    expect(localStorage.getItem('wirdlink.demo.v1')).toBeNull();
  });

  it('filters recurrence and selects the whole remaining quantity', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('[aria-controls="filters"]')!.click();
    harness.detectChanges();
    const select = harness.routeNativeElement!.querySelector<HTMLSelectElement>('#recurrence')!;
    select.value = 'Tous les jours';
    select.dispatchEvent(new Event('change'));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('article').length).toBe(1);
    expect(harness.routeNativeElement!.querySelector('article')?.textContent).toContain('Salatoul Fatihi');
    await harness.navigateByUrl('/wird/salat-nabi');
    const buttons = [...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('.choice-list button')];
    buttons.find((button) => button.textContent?.trim() === 'Tout')!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!.value).toBe('400');
  });

});
