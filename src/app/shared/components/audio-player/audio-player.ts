import { Translate } from '../../pipes/translate';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { AudioPlayback } from '../../../core/audio-playback';

export function formatAudioTime(value: number): string {
  const seconds = Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
@Component({
  selector: 'app-audio-player',
  imports: [Translate, Icon],
  templateUrl: './audio-player.html',
  styleUrl: './audio-player.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AudioPlayer {
  readonly source = input.required<string>();
  readonly title = input('Note vocale');
  protected readonly playing = signal(false);
  protected readonly elapsed = signal(0);
  protected readonly duration = signal(0);
  protected readonly error = signal('');
  protected readonly formatTime = formatAudioTime;
  private readonly audio = viewChild<ElementRef<HTMLAudioElement>>('audio');
  private readonly playback = inject(AudioPlayback);

  constructor() {
    effect((onCleanup) => {
      this.source();
      const audio = this.audio()?.nativeElement;
      if (audio) {
        audio.pause();
        onCleanup(() => this.playback.release(audio));
      }
      this.playing.set(false);
      this.elapsed.set(0);
      this.duration.set(0);
      this.error.set('');
    });
  }

  protected async toggle(): Promise<void> {
    const audio = this.audio()?.nativeElement;
    if (!audio) return;
    this.error.set('');
    if (!audio.paused) {
      audio.pause();
      return;
    }
    this.playback.claim(audio);
    try {
      await audio.play();
    } catch {
      this.error.set('Lecture indisponible. Réessayez.');
      this.playing.set(false);
    }
  }

  protected updateTime(): void {
    const audio = this.audio()?.nativeElement;
    if (!audio) return;
    this.elapsed.set(audio.currentTime);
    this.duration.set(audio.duration);
  }
  protected reportError(): void {
    this.playing.set(false);
    this.error.set('Ce fichier audio ne peut pas être lu.');
  }
}
