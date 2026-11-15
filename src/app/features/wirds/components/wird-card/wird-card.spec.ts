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
