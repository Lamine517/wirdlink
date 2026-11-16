import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';

interface InstallPrompt extends Event {
  prompt(): Promise<{ outcome: 'accepted' | 'dismissed' } | void>;
  userChoice?: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Injectable({ providedIn: 'root' })
export class DeviceInstall {
  private readonly deferred = signal<InstallPrompt | null>(null);
  readonly available = computed(() => this.deferred() !== null);
  readonly installed = signal(
    window.matchMedia('(display-mode: standalone)').matches ||
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone),
  );
  readonly message = signal('');
  readonly busy = signal(false);

  constructor() {
    const beforeInstall = (event: Event) => {
      if (!('prompt' in event) || typeof event.prompt !== 'function') return;
      event.preventDefault();
      this.deferred.set(event as InstallPrompt);
    };
    const installed = () => {
      this.installed.set(true);
      this.deferred.set(null);
      this.message.set('WirdLink a été ajouté.');
    };
    window.addEventListener('beforeinstallprompt', beforeInstall);
    window.addEventListener('appinstalled', installed);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', beforeInstall);
      window.removeEventListener('appinstalled', installed);
    });
  }

  async install(): Promise<void> {
    const prompt = this.deferred();
    if (!prompt || this.busy()) return;
    this.busy.set(true);
    this.message.set('');
    try {
      const choice = (await prompt.prompt()) ?? (await prompt.userChoice);
      this.message.set(
        !choice || choice.outcome === 'accepted'
          ? 'Installation demandée au navigateur.'
          : 'Vous pourrez l’ajouter plus tard.',
      );
    } catch {
      this.message.set('Ajout indisponible. Utilisez le menu de votre navigateur.');
    } finally {
      this.deferred.set(null);
      this.busy.set(false);
    }
  }
}
