import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Wird } from '../../../../core/wird-store';
import { WirdStats } from './wird-stats';

const WIRD: Wird = {
  id: 'daily',
  title: 'Wird quotidien',
  recurrence: 'Tous les jours',
  visibility: 'private',
  target: 10,
  completed: 0,
  isOwner: true,
  startDate: '2026-11-01',
};

describe('Wird stats', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-11-17T12:00:00Z'));
    TestBed.configureTestingModule({ imports: [WirdStats], providers: [provideRouter([])] });
  });
  afterEach(() => jasmine.clock().uninstall());

  function render(full: boolean, offer: boolean): HTMLElement {
    const fixture = TestBed.createComponent(WirdStats);
    fixture.componentRef.setInput('wird', WIRD);
    fixture.componentRef.setInput('stats', {
      participants: 2,
      days: [{ day: '2026-11-02', finished: 10 }],
    });
    fixture.componentRef.setInput('full', full);
    fixture.componentRef.setInput('offer', offer);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('shows the latest periods and points to the pass when the offer is open', () => {
    const element = render(false, true);
    expect(element.querySelectorAll('.wird-stats__cycles li').length).toBe(7);
    expect(element.querySelector('.wird-stats__more a')?.getAttribute('href')).toBe('/pass');
  });

  it('shows every period with an active pass', () => {
    const element = render(true, true);
    expect(element.querySelectorAll('.wird-stats__cycles li').length).toBe(17);
    expect(element.querySelector('.wird-stats__more')).toBeNull();
  });

  it('does not mention the pass while the offer is closed', () => {
    expect(render(false, false).querySelector('.wird-stats__more')).toBeNull();
  });
});
