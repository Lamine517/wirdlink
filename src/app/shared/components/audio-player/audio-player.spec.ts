import { TestBed } from '@angular/core/testing';
import { AudioPlayer, formatAudioTime } from './audio-player';

describe('Audio button', () => {
  it('plays and pauses the actual audio element from its button', async () => {
    const fixture = TestBed.createComponent(AudioPlayer);
    fixture.componentRef.setInput('source', 'data:audio/wav;base64,');
    fixture.detectChanges();
    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    let paused = true;
    spyOnProperty(audio, 'paused', 'get').and.callFake(() => paused);
    const play = spyOn(audio, 'play').and.callFake(() => {
      paused = false;
      audio.dispatchEvent(new Event('play'));
      return Promise.resolve();
    });
    const pause = spyOn(audio, 'pause').and.callFake(() => {
      paused = true;
      audio.dispatchEvent(new Event('pause'));
    });
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    button.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(play).toHaveBeenCalled();
    expect(button.textContent).toContain('Pause');
    expect(button.classList.contains('audio-player--playing')).toBeTrue();
    button.click();
    fixture.detectChanges();
    expect(pause).toHaveBeenCalled();
    expect(button.textContent).toContain('Écouter');
    pause.calls.reset();
    fixture.destroy();
    expect(pause).toHaveBeenCalled();
  });
  it('reports playback failure and resets at the end', async () => {
    const fixture = TestBed.createComponent(AudioPlayer);
    fixture.componentRef.setInput('source', 'data:audio/wav;base64,');
    fixture.detectChanges();
    const audio = fixture.nativeElement.querySelector('audio') as HTMLAudioElement;
    spyOn(audio, 'play').and.returnValue(Promise.reject(new Error('Unsupported')));
    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role=alert]')?.textContent).toContain(
      'indisponible',
    );
    audio.dispatchEvent(new Event('play'));
    fixture.detectChanges();
    audio.dispatchEvent(new Event('ended'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button').textContent).toContain('Écouter');
  });
  it('formats duration safely', () => {
    expect(formatAudioTime(65.9)).toBe('1:05');
    expect(formatAudioTime(Infinity)).toBe('0:00');
  });
});
