import { Translate } from '../../pipes/translate';
import { ChangeDetectionStrategy, Component, effect, input, signal } from '@angular/core';

@Component({
  imports: [Translate],
  selector: 'app-qr-code',
  template: `@if (image(); as source) {
      <img
        [src]="source"
        width="150"
        height="150"
        [alt]="'QR code pour ouvrir WirdLink sur le téléphone' | t"
      />
    } @else {
      <p role="status">{{ (error() ? 'QR indisponible' : 'Préparation du QR…') | t }}</p>
    }`,
  styles: `
    :host {
      display: grid;
      place-items: center;
      min-width: 150px;
      min-height: 150px;
    }
    img {
      display: block;
    }
    p {
      font-size: 0.875rem;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QrCode {
  readonly value = input.required<string>();
  protected readonly image = signal('');
  protected readonly error = signal(false);
  constructor() {
    effect((onCleanup) => {
      const value = this.value();
      let cancelled = false;
      this.image.set('');
      this.error.set(false);
      onCleanup(() => {
        cancelled = true;
      });
      void import('qrcode')
        .then((qr) =>
          qr.default.toDataURL(value, {
            width: 150,
            margin: 2,
            errorCorrectionLevel: 'M',
            color: { dark: '#026780', light: '#ffffff' },
          }),
        )
        .then((url) => {
          if (!cancelled) this.image.set(url);
        })
        .catch(() => {
          if (!cancelled) this.error.set(true);
        });
    });
  }
}
