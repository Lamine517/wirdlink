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

  it('starts with guidance and examples instead of an action or error', () => {
    const input = harness.routeNativeElement!.querySelector<HTMLInputElement>('#quantity')!;
    expect(input.value).toBe('');
    expect(input.placeholder).toBe('Ex. 10');
    expect(submitButton()).toBeNull();
    expect(harness.routeNativeElement!.querySelector('#quantity-error')).toBeNull();
    expect(harness.routeNativeElement!.textContent).toContain('Choisissez une quantité');
  });

  it('shows the action for valid quantities and removes it for fractional or excessive values', () => {
    enterQuantity('10');
    expect(submitButton()).not.toBeNull();
    enterQuantity('401');
    expect(submitButton()).toBeNull();
    expect(harness.routeNativeElement!.querySelector('#quantity-error')?.textContent).toContain(
      'Il ne reste que 400',
    );
    enterQuantity('1.5');
    expect(submitButton()).toBeNull();
    enterQuantity('400');
    expect(submitButton()).not.toBeNull();
  });

  it('requires a meaningful name only when Mon nom is selected', () => {
    enterQuantity('10');
    const nameChoice = [
      ...harness.routeNativeElement!.querySelectorAll<HTMLButtonElement>('fieldset button'),
    ].find((button) => button.textContent?.trim() === 'Mon nom')!;
    nameChoice.click();
    harness.detectChanges();
    expect(submitButton()).toBeNull();
    const name = harness.routeNativeElement!.querySelector<HTMLInputElement>('#name')!;
    expect(name.placeholder).toBe('Ex. Awa');
    name.value = '   ';
    name.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(submitButton()).toBeNull();
    name.value = 'Awa';
    name.dispatchEvent(new Event('input'));
    harness.detectChanges();
    expect(submitButton()).not.toBeNull();
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
});
