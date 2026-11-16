import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Icon } from '../icon/icon';
import { isShareableAddress } from '../desktop-companion/share-address';

export type ShareChannel = 'whatsapp' | 'facebook' | 'telegram' | 'sms';
export function socialShareUrl(channel: ShareChannel, url: string): string | null {
  if (!isShareableAddress(url)) return null;
  const encoded = encodeURIComponent(url);
  switch (channel) {
    case 'whatsapp':
      return 'https://wa.me/?text=' + encodeURIComponent('WirdLink ' + url);
    case 'facebook':
      return 'https://www.facebook.com/sharer/sharer.php?u=' + encoded;
    case 'telegram':
      return 'https://t.me/share/url?url=' + encoded;
    case 'sms':
      return 'sms:?body=' + encodeURIComponent('WirdLink ' + url);
  }
}

@Component({
  selector: 'app-share-actions',
  imports: [Translate, Icon],
  templateUrl: './share-actions.html',
  styleUrl: './share-actions.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareActions {
  readonly url = input.required<string>();
  readonly title = input('Partager ce wird');
  readonly panelId = input.required<string>();
  readonly mobileOptions = input(false);
  protected readonly shareable = computed(() => isShareableAddress(this.url()));
  protected readonly nativeShareAvailable = typeof navigator.share === 'function';
  protected readonly message = signal('');
  protected readonly sharing = signal(false);

  protected open(channel: ShareChannel): void {
    const address = socialShareUrl(channel, this.url());
    if (!address) return;
    if (channel === 'sms') window.location.assign(address);
    else window.open(address, '_blank', 'noopener,noreferrer');
  }

  protected async share(): Promise<void> {
    if (!this.shareable() || !this.nativeShareAvailable || this.sharing()) return;
    this.sharing.set(true);
    this.message.set('');
    try {
      await navigator.share({ title: this.title(), url: this.url() });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        this.message.set('Partage indisponible. Vous pouvez copier le lien.');
    } finally {
      this.sharing.set(false);
    }
  }

  protected async copy(): Promise<void> {
    this.message.set('');
    try {
      await navigator.clipboard.writeText(this.url());
      this.message.set('Lien copié.');
    } catch {
      this.message.set('Copie indisponible. Sélectionnez le lien ci-dessous.');
    }
  }
}
