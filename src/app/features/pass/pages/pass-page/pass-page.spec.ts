import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { DEFAULT_PASS_SETTINGS, PassService, PassStatus } from '../../../../core/pass/pass-service';
import { AuthFlow } from '../../../auth/data-access/auth-flow';
import { PassPage } from './pass-page';

const STATUS: PassStatus = {
  active: false,
  kind: null,
  endsOn: null,
  hadPass: false,
  privateInProgress: 3,
  privateAllowed: false,
  isAdmin: false,
  founder: false,
  foundersLeft: 5,
};

describe('Pass page', () => {
  let passes: {
    settings: ReturnType<typeof signal<typeof DEFAULT_PASS_SETTINGS>>;
    status: ReturnType<typeof signal<PassStatus | null>>;
    loadSettings: jasmine.Spy;
    loadStatus: jasmine.Spy;
    startTrial: jasmine.Spy;
    clear: jasmine.Spy;
  };

  function setup(enabled: boolean, status: PassStatus | null) {
    passes = {
      settings: signal({ ...DEFAULT_PASS_SETTINGS, enabled }),
      status: signal(status),
      loadSettings: jasmine.createSpy('loadSettings').and.resolveTo(),
      loadStatus: jasmine.createSpy('loadStatus').and.resolveTo(status),
      startTrial: jasmine.createSpy('startTrial').and.resolveTo(),
      clear: jasmine.createSpy('clear'),
    };
    TestBed.configureTestingModule({
      imports: [PassPage],
      providers: [
        provideRouter([]),
        { provide: PassService, useValue: passes },
        { provide: AuthFlow, useValue: { session: signal(status ? { id: 'me' } : null) } },
      ],
    });
    const fixture = TestBed.createComponent(PassPage);
    fixture.detectChanges();
    return fixture;
  }

  it('stays discreet while the offer is disabled', async () => {
    const fixture = setup(false, STATUS);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.textContent).toContain('pas encore proposé');
    expect(element.querySelector('.pass-formula')).toBeNull();
  });

  it('offers the trial and the prices, founder places included', async () => {
    const fixture = setup(true, STATUS);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const formulas = [...element.querySelectorAll('.pass-formula')].map((item) => item.textContent);
    expect(formulas.length).toBe(3);
    expect(formulas[2]).toContain('10');
    const trial = [...element.querySelectorAll<HTMLButtonElement>('.pass-status button')].find(
      (button) => button.textContent?.includes('essai'),
    )!;
    trial.click();
    expect(passes.startTrial).toHaveBeenCalled();
  });

  it('hides the founder price once every place is taken', async () => {
    const fixture = setup(true, { ...STATUS, foundersLeft: 0, hadPass: true });
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('.pass-formula').length).toBe(2);
    expect(element.querySelector('.pass-status button')).toBeNull();
  });
});
