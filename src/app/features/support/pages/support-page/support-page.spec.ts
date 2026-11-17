import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SupportPage } from './support-page';

describe('Support page', () => {
  beforeEach(() =>
    TestBed.configureTestingModule({ imports: [SupportPage], providers: [provideRouter([])] }),
  );

  function setup() {
    const fixture = TestBed.createComponent(SupportPage);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const wave = () => element.querySelector<HTMLButtonElement>('.support-method--wave')!;
    return { fixture, element, wave };
  }

  it('suggests amounts and accepts another amount within the limits', () => {
    const { fixture, element, wave } = setup();
    expect(element.querySelectorAll('.support-amounts button').length).toBe(4);
    expect(wave().disabled).toBeFalse();
    expect(wave().textContent).toContain('1');
    const input = element.querySelector<HTMLInputElement>('#support-custom')!;
    input.value = '50';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(wave().disabled).toBeTrue();
    expect(element.querySelector('.support-hint[role="alert"]')).not.toBeNull();
    input.value = '3000';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(wave().disabled).toBeFalse();
    expect(wave().textContent).toContain('3');
  });

  for (const method of ['wave', 'orange']) {
    it(`gives the ${method} number with the chosen amount`, () => {
      const { fixture, element } = setup();
      element.querySelectorAll<HTMLButtonElement>('.support-amounts button')[3].click();
      element.querySelector<HTMLButtonElement>('.support-method--' + method)!.click();
      fixture.detectChanges();
      expect(element.querySelector('.support-number')?.textContent).toContain('76 557 83 79');
      expect(element.querySelector('.support-step')?.textContent).toContain('5');
      expect(element.querySelector('.support-hint')?.textContent).toContain(
        method === 'wave' ? 'Wave' : 'Max it',
      );
    });
  }
});
