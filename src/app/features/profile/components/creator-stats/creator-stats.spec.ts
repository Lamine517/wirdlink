import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Wird } from '../../../../core/wird-store';
import { CreatorStats } from './creator-stats';

function wird(id: string, recurrence: Wird['recurrence'], target: number): Wird {
  return {
    id,
    title: 'Wird ' + id,
    recurrence,
    visibility: 'public',
    target,
    completed: 0,
    isOwner: true,
    startDate: '2026-11-16',
  };
}

describe('Creator stats', () => {
  beforeEach(() => {
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date('2026-11-17T12:00:00Z'));
    TestBed.configureTestingModule({ imports: [CreatorStats], providers: [provideRouter([])] });
  });
  afterEach(() => jasmine.clock().uninstall());

  it('adds up every wird of the creator and links to each follow-up', () => {
    const fixture = TestBed.createComponent(CreatorStats);
    fixture.componentRef.setInput('wirds', [wird('a', 'Tous les jours', 10), wird('b', 'Une fois', 100)]);
    fixture.componentRef.setInput('stats', {
      participants: 4,
      wirds: [
        { id: 'a', days: [{ day: '2026-11-16', finished: 12 }, { day: '2026-11-17', finished: 3 }] },
        { id: 'b', days: [{ day: '2026-11-16', finished: 40 }] },
        { id: 'unknown', days: [{ day: '2026-11-16', finished: 99 }] },
      ],
    });
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const totals = [...element.querySelectorAll('.creator-stats__totals strong')].map(
      (node) => node.textContent?.trim(),
    );
    expect(totals).toEqual(['2', '4', '55', '1']);
    expect(element.querySelector('.creator-stats__summary')?.textContent).toContain('1');
    expect(element.querySelector('.creator-stats__summary')?.textContent).toContain('3');
    const links = element.querySelectorAll('.creator-stats__list a');
    expect(links.length).toBe(2);
    expect(links[0].getAttribute('href')).toBe('/wird/a/participants');
    expect(links[0].textContent).toContain('1 sur 2');
    expect(links[1].textContent).toContain('0 sur 1');
  });
});
