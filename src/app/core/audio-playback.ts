import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AudioPlayback {
  private active: HTMLAudioElement | null = null;
  claim(audio: HTMLAudioElement): void {
    if (this.active && this.active !== audio) this.active.pause();
    this.active = audio;
  }
  release(audio: HTMLAudioElement): void {
    if (this.active === audio) this.active = null;
    audio.pause();
  }
}
