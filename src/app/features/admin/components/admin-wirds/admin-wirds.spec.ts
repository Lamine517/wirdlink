import { TestBed } from '@angular/core/testing';
import { AdminApi, AdminWird } from '../../data-access/admin-api';
import { AdminWirds, wirdIdFromLink } from './admin-wirds';
import { parseAmounts } from '../admin-donations/admin-donations';

const ID = '0f8a2b44-1c3d-4e5f-8a9b-0c1d2e3f4a5b';

const WIRDS: AdminWird[] = [
  {
    id: ID,
    title: 'Salat du vendredi',
    description: 'Pour le Magal',
    visibility: 'public',
    author: 'Awa Ndiaye',
    createdAt: '2026-11-10T10:00:00Z',
    participants: 4,
    hidden: false,
    reason: '',
  },
  {
    id: 'b',
    title: '',
    description: '',
    visibility: 'private',
    author: 'Moussa Fall',
    createdAt: '2026-11-11T10:00:00Z',
    participants: 1,
    hidden: true,
    reason: 'Signalé',
  },
];

describe('Admin wirds', () => {
  it('reads a wird id from any shared link', () => {
    expect(wirdIdFromLink(`https://wirdlink.vercel.app/wird/${ID.toUpperCase()}`)).toBe(ID);
    expect(wirdIdFromLink(`/acces/${ID}?code=1`)).toBe(ID);
    expect(wirdIdFromLink('https://wirdlink.vercel.app/')).toBeNull();
  });

  it('parses donation amounts typed by the team', () => {
    expect(parseAmounts('500, 1 000; 2000')).toEqual([500, 1000, 2000]);
    expect(parseAmounts('500, abc')).toBeNull();
    expect(parseAmounts('1,2,3,4,5,6,7')).toBeNull();
  });

  it('hides a public wird with a reason and never shows private content', async () => {
    const api = jasmine.createSpyObj<AdminApi>('AdminApi', ['wirds', 'hideWird', 'unhideWird']);
    api.wirds.and.resolveTo(WIRDS);
    api.hideWird.and.resolveTo();
    TestBed.configureTestingModule({
      imports: [AdminWirds],
      providers: [{ provide: AdminApi, useValue: api }],
    });
    const fixture = TestBed.createComponent(AdminWirds);
    await fixture.whenStable();
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const cards = element.querySelectorAll('.admin-list li.surface-card');
    expect(cards.length).toBe(2);
    expect(cards[1].textContent).toContain('Wird avec code');
    expect(cards[1].textContent).toContain('Masqué · Signalé');

    element.querySelectorAll<HTMLButtonElement>('.admin-wirds__filters button')[1].click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.admin-list li.surface-card').length).toBe(1);
    element.querySelectorAll<HTMLButtonElement>('.admin-wirds__filters button')[0].click();
    fixture.detectChanges();

    const search = element.querySelector<HTMLInputElement>('#admin-wird-search')!;
    search.value = 'aucun-match';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.querySelector('app-empty-state')?.textContent).toContain('Aucun wird trouvé');
    element.querySelector<HTMLButtonElement>('app-empty-state button')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.admin-list li.surface-card').length).toBe(2);

    const hideButton = element.querySelector<HTMLButtonElement>('.wird-row__action--hide')!;
    expect(hideButton.getAttribute('aria-label')).toBe('Masquer Salat du vendredi');
    hideButton.click();
    fixture.detectChanges();
    const reason = element.querySelector<HTMLInputElement>('#admin-hide-reason')!;
    reason.value = 'Contenu inapproprié';
    reason.dispatchEvent(new Event('input'));
    [...element.querySelectorAll<HTMLButtonElement>('.button--danger')].at(-1)!.click();
    await fixture.whenStable();
    expect(api.hideWird).toHaveBeenCalledWith(ID, 'Contenu inapproprié');
  });
});
