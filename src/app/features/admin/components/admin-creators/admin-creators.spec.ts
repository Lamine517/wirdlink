import { TestBed } from '@angular/core/testing';
import { AdminApi, AdminOverview } from '../../data-access/admin-api';
import { PassError } from '../../../../core/pass/pass-service';
import { WIRD_TEST_PROVIDER } from '../../../../testing/wird-fixtures.spec';
import { AdminCreators } from './admin-creators';

const OVERVIEW: AdminOverview = {
  totals: {
    wirds: 2,
    privateWirds: 1,
    creators: 2,
    participants: 3,
    finished: 10,
    activePasses: 0,
    trials: 0,
    founders: 0,
    collected: 0,
  },
  creators: [
    {
      id: 'a',
      name: 'Awa Ndiaye',
      organization: 'Dahira Touba',
      contact: 'awa@example.com',
      wirds: 4,
      privateInProgress: 3,
      passEndsOn: null,
      passKind: null,
    },
    {
      id: 'b',
      name: 'Moussa Fall',
      organization: '',
      contact: '+221770000000',
      wirds: 1,
      privateInProgress: 0,
      passEndsOn: '2027-01-01',
      passKind: 'month',
    },
  ],
  passes: [],
};

describe('Admin creators', () => {
  let api: jasmine.SpyObj<AdminApi>;

  function setup() {
    api = jasmine.createSpyObj<AdminApi>('AdminApi', ['grantPass', 'revokePass']);
    TestBed.configureTestingModule({
      imports: [AdminCreators],
      providers: [WIRD_TEST_PROVIDER, { provide: AdminApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(AdminCreators);
    fixture.componentRef.setInput('overview', OVERVIEW);
    fixture.detectChanges();
    return { fixture, element: fixture.nativeElement as HTMLElement };
  }

  it('finds a creator by name, dahira or contact', () => {
    const { fixture, element } = setup();
    expect(element.querySelectorAll('.admin-list:first-of-type li.surface-card').length).toBe(2);
    const search = element.querySelector<HTMLInputElement>('#admin-search')!;
    search.value = 'touba';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelectorAll('.admin-list:first-of-type li.surface-card').length).toBe(1);
    expect(element.textContent).toContain('Awa Ndiaye');
  });

  it('grants a pass with the configured price and reports full founder places', async () => {
    const { fixture, element } = setup();
    element.querySelector<HTMLButtonElement>('.admin-list li .button')!.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#admin-amount')!.value).toBe('15000');

    api.grantPass.and.rejectWith(new PassError('founders_full'));
    const founder = [...element.querySelectorAll<HTMLButtonElement>('.admin-kinds button')].find(
      (button) => button.textContent?.includes('fondateur'),
    )!;
    founder.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('#admin-amount')!.value).toBe('10000');
    [...element.querySelectorAll<HTMLButtonElement>('button')]
      .find((button) => button.textContent?.includes('Enregistrer le pass'))!
      .click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(api.grantPass).toHaveBeenCalledWith('a', 'founder', 10000, '');
    expect(element.textContent).toContain('places de fondateur sont prises');
  });
});
