import { TestBed } from '@angular/core/testing';
import { RouterTestingHarness } from '@angular/router/testing';
import { appConfig } from '../../../../app.config';
import { WirdStore } from '../../../../core/wird-store';

describe('Guided participation form', () => {
  let harness: RouterTestingHarness;

  beforeEach(async () => {
    localStorage.removeItem('wirdlink.demo.v1');
    TestBed.configureTestingModule({ providers: appConfig.providers });
    harness = await RouterTestingHarness.create('/wird/salat-nabi');
  });

  afterEach(() => localStorage.removeItem('wirdlink.demo.v1'));

  function enterQuantity(value: string): void {
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    harness.detectChanges();
  }

  function submitButton(): HTMLButtonElement | null {
    return harness.routeNativeElement!.querySelector<HTMLButtonElement>('button[type="submit"]');
  }

  it('starts with a disabled action, guidance and examples without an error', () => {
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Ex. 10');
    expect(submitButton()?.disabled).toBeTrue();
    expect(harness.routeNativeElement!.querySelector('#quantity-error')).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Choisissez une quantité');
  });

  it('enables the action only for valid quantities', () => {
    enterQuantity('10');
    expect(submitButton()?.disabled).toBeFalse();
    enterQuantity('401');
    expect(submitButton()?.disabled).toBeTrue();
    expect(harness.routeNativeElement!.querySelector('#quantity-error')?.textContent).toContain(
      'Il ne reste que 400',
    );
    enterQuantity('1.5');
    expect(submitButton()?.disabled).toBeTrue();
    enterQuantity('400');
    expect(submitButton()?.disabled).toBeFalse();
  });

  it('requires a meaningful name only when Mon nom is selected', () => {
    enterQuantity('10');
    const nameChoice = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('fieldset button'),
    ].find((button) => button.textContent?.trim() === 'Mon nom')!;
    nameChoice.click();
    harness.detectChanges();
    expect(submitButton()?.disabled).toBeTrue();
    const name = harness.routeNativeElement!.querySelector<HTMLInputElement>('#name')!;
    expect(name.placeholder).toBe('Ex. Awa');
    name.value = '   ';
    name.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(submitButton()?.disabled).toBeTrue();
    name.value = 'Awa';
    name.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(submitButton()?.disabled).toBeFalse();
  });

  it('rejects implicit keyboard submission until valid and then reserves once', async () => {
    const form = harness.routeNativeElement!.querySelector('form')!;
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    harness.detectChanges();
    expect(TestBed.inject(WirdStore).parts()).toEqual([]);
    enterQuantity('10');
    submitButton()!.click();
    await harness.fixture.whenStable();
    harness.detectChanges();
    expect(TestBed.inject(WirdStore).parts().length).toBe(1);
    expect(harness.routeNativeElement!.querySelector('h1')?.textContent).toBe('Mes parts');
  });
  it('keeps collective completion distinct from the chosen quantity', () => {
    const ring = harness.routeNativeElement!.querySelector<HTMLElement>('[role="progressbar"]')!;
    expect(ring.getAttribute('aria-label')).toContain('Salat ala Nabi');
    expect(ring.getAttribute('aria-valuenow')).toBe('600');
    expect(ring.getAttribute('aria-valuemax')).toBe('1000');
    enterQuantity('10');
    expect(ring.getAttribute('aria-valuenow')).toBe('600');
    expect(
      harness.routeNativeElement!.querySelector('.participation-summary__stats')?.textContent,
    ).toContain('400');
    expect(submitButton()?.disabled).toBeFalse();
  });
  it('selects a suggested share in one tap and adapts after another reservation', () => {
    const store = TestBed.inject(WirdStore);
    const suggestions = () =>
      [
        ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>(
          'app-quantity-picker .choice-list button',
        ),
      ].filter((button) => button.value !== 'all');
    expect(suggestions().map((button) => button.textContent?.trim())).toEqual(['50', '100', '200']);
    suggestions()[1].click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!.value).toBe(
      '100',
    );
    suggestions()[1].click();
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!.value).toBe(
      '100',
    );
    store.reserve('salat-nabi', 363, '');
    harness.detectChanges();
    expect(suggestions().map((button) => button.textContent?.trim())).toEqual(['5', '10', '20']);
    expect(submitButton()?.disabled).toBeTrue();
    suggestions()[1].click();
    harness.detectChanges();
    expect(submitButton()?.disabled).toBeFalse();
  });
});
