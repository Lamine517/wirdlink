import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Icon } from '../icon/icon';
import { QrCode } from '../qr-code/qr-code';
import { isShareableAddress } from './share-address';

@Component({
  selector: 'app-desktop-intro',
  imports: [Icon, QrCode],
  templateUrl: './desktop-intro.html',
  styleUrl: './desktop-companion.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DesktopIntro {
  readonly url = input.required<string>();
  protected readonly shareable = computed(() => isShareableAddress(this.url()));
}
