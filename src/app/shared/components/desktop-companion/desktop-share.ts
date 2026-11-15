import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Icon, IconName } from '../icon/icon';
import { isShareableAddress } from './share-address';

@Component({
  selector: 'app-desktop-share',
  imports: [Icon],
  templateUrl: './desktop-share.html',
  styleUrl: './desktop-companion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopShare {
  readonly url = input.required<string>();
  readonly isWird = input(false);
  protected readonly message = signal('');
  protected readonly shareable = computed(() => isShareableAddress(this.url()));
  protected readonly options: {
    key: 'whatsapp' | 'facebook' | 'telegram';
    label: string;
    icon: IconName;
  }[] = [
    { key: 'whatsapp', label: 'WhatsApp', icon: 'whatsapp' },
    { key: 'facebook', label: 'Facebook', icon: 'facebook' },
    { key: 'telegram', label: 'Telegram', icon: 'telegram' },
  ];
  protected openShare(key: 'whatsapp' | 'facebook' | 'telegram'): void {
    if (!this.shareable()) return;
    const encoded = encodeURIComponent(this.url());
    const links = {
      whatsapp: `https://wa.me/?text=${encodeURIComponent('WirdLink ' + this.url())}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encoded}`,
      telegram: `https://t.me/share/url?url=${encoded}`,
    };
    window.open(links[key], '_blank', 'noopener,noreferrer');
  }
  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.url());
      this.message.set('Lien copié.');
    } catch {
      this.message.set('Copie indisponible. Sélectionnez le lien ci-dessous.');
    }
  }
}
