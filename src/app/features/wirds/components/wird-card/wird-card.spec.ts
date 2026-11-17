import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { WirdCard } from './wird-card';
import { Wird } from '../../../../core/wird-store';

describe('Wird audio availability', () => {
  it('offers listening only when a real audio source is present', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WirdCard);
    const wird: Wird = {
      id: 'one',
      title: 'Wird',
      target: 1000,
      completed: 600,
      recurrence: 'Une fois',
      visibility: 'public',
    };
    fixture.componentRef.setInput('wird', wird);
    fixture.componentRef.setInput('available', 400);
    fixture.componentRef.setInput('completed', 600);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-audio-player')).toBeNull();
    fixture.componentRef.setInput('wird', { ...wird, audioUrl: 'data:audio/wav;base64,' });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-audio-player')).not.toBeNull();
  });
});

describe('Wird card phase', () => {
  function render(wird: Partial<Wird>, completed: number, available: number) {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(WirdCard);
    fixture.componentRef.setInput('wird', {
      id: 'one',
      title: 'Wird',
      target: 10,
      completed,
      recurrence: 'Tous les jours',
      visibility: 'public',
      startDate: '2026-11-16',
      ...wird,
    });
    fixture.componentRef.setInput('completed', completed);
    fixture.componentRef.setInput('available', available);
    fixture.componentRef.setInput('today', '2026-11-19');
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('tells when a reached daily wird starts again', () => {
    const card = render({}, 10, 0);
    expect(card.textContent).toContain('Objectif atteint. Il recommence demain.');
    expect(card.querySelector('.button--accent')).toBeNull();
  });

  it('hides participation once the end date has passed or before the start', () => {
    expect(render({ endDate: '2026-11-18' }, 0, 10).querySelector('.button--accent')).toBeNull();
    TestBed.resetTestingModule();
    const upcoming = render({ startDate: '2026-11-21' }, 0, 10);
    expect(upcoming.querySelector('.button--accent')).toBeNull();
    expect(upcoming.textContent).toContain('Ce wird commence');
  });
});
