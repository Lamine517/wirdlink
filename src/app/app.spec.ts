import { Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { appConfig } from './app.config';
import { RouterTestingHarness } from '@angular/router/testing';
import { App } from './app';

describe('WirdLink navigation', () => {
  async function waitForSheetClose(dialog: HTMLDialogElement): Promise<void> {
    for (let attempt = 0; attempt < 30 && dialog.open; attempt++) {
      await new Promise<void>((resolve) => setTimeout(resolve, 16));
    }
    expect(dialog.open).toBeFalse();
  }

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
    harness
      .routeNativeElement!.querySelector('form')!
      .dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('[role="alert"]')?.textContent).toContain(
      'entre 1 et 400',
    );
    expect(localStorage.getItem('wirdlink.demo.v1')).toBeNull();
  });

  it('filters recurrence and selects the whole remaining quantity', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('[aria-controls="filters"]')!
      .click();
    harness.detectChanges();
    const dialog = harness.routeNativeElement!.querySelector<HTMLDialogElement>('dialog')!;
    expect(dialog.open).toBeTrue();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('button[value="Tous les jours"]')!
      .click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('article').length).toBe(1);
    expect(harness.routeNativeElement!.querySelector('article')?.textContent).toContain(
      'Salatoul Fatihi',
    );
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.bottom-sheet__close')!.click();
    harness.detectChanges();
    await waitForSheetClose(dialog);
    await harness.navigateByUrl('/wird/salat-nabi');
    const buttons = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('.choice-list button'),
    ];
    buttons.find((button) => button.value === 'all')!.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!.value).toBe(
      '400',
    );
  });
  it('marks an excessive quantity immediately and clears the error after correction', async () => {
    const harness = await RouterTestingHarness.create('/wird/salat-nabi');
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!;
    input.value = '1500';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.classList.contains('quantity-counter__input--invalid')).toBeTrue();
    expect(harness.routeNativeElement!.querySelector('#quantity-error')?.textContent).toContain(
      'Il ne reste que 400',
    );
    input.value = '10';
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(harness.routeNativeElement!.querySelector('#quantity-error')).toBeNull();
  });

  it('shows a reusable empty state and opens the creation templates', async () => {
    const harness = await RouterTestingHarness.create('/mes-parts');
    expect(harness.routeNativeElement!.querySelector('app-empty-state h2')?.textContent).toContain(
      'pas encore participé',
    );
    expect(
      harness.routeNativeElement!.querySelector('app-empty-state a')?.getAttribute('href'),
    ).toBe('/');
    await harness.navigateByUrl('/creer');
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Créer un wird');
    expect(harness.routeNativeElement!.querySelectorAll('.template-card').length).toBe(5);
  });

  it('clears filter choices and closes the sheet on backdrop interaction', async () => {
    const harness = await RouterTestingHarness.create('/');
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('[aria-controls="filters"]')!
      .click();
    harness.detectChanges();
    harness
      .routeNativeElement!.querySelector<HTMLButtonElement>('button[value="Chaque semaine"]')!
      .click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('article').length).toBe(0);
    const clear = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('dialog button'),
    ].find((button) => button.textContent?.trim() === 'Tout effacer')!;
    clear.click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelectorAll('article').length).toBe(2);
    const dialog = harness.routeNativeElement!.querySelector<HTMLDialogElement>('dialog')!;
    dialog.click();
    harness.detectChanges();
    await waitForSheetClose(dialog);
  });
  it('marks the matching menu section on nested pages', async () => {
    const fixture = TestBed.createComponent(App);
    const router = TestBed.inject(Router);
    fixture.detectChanges();
    for (const [route, link] of [
      ['/creer/contenu', '/creer'],
      ['/mes-parts', '/mes-parts'],
      ['/wird/salat-nabi', '/'],
    ]) {
      await router.navigateByUrl(route);
      await fixture.whenStable();
      fixture.detectChanges();
      const active = (fixture.nativeElement as HTMLElement).querySelector(
        '.bottom-nav a[aria-current="page"]',
      );
      expect(active?.getAttribute('href')).toBe(link);
      expect(active?.querySelector('app-icon')).not.toBeNull();
    }
    await router.navigateByUrl('/preferences');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.bottom-nav [aria-current="page"]'),
    ).toBeNull();
  });
});
