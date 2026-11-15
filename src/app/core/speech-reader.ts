import { Injectable, OnDestroy, signal } from '@angular/core';

@Injectable()
export class SpeechReader implements OnDestroy {
  readonly error = signal('');

  read(text: string): void {
    this.error.set('');
    if (!('speechSynthesis' in window)) {
      this.error.set(
        'La lecture vocale est indisponible sur ce navigateur. Le texte reste affiché.',
      );
      return;
    }
    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(text);
    speech.lang = 'fr-FR';
    speech.onerror = () =>
      this.error.set('La lecture vocale n’a pas pu démarrer. Le texte reste affiché.');
    window.speechSynthesis.speak(speech);
  }

  ngOnDestroy(): void {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }
}
