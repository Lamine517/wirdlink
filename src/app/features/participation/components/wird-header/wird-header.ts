import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { isShareableAddress } from '../../../../shared/components/desktop-companion/share-address';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-wird-header',
  imports: [BackButton, Icon],
  template: `<header>
    <div class="wird-header__toolbar">
      <app-back-button />
      @if (shareLink(); as link) {
        <button
          type="button"
          class="wird-header__share"
          [disabled]="sharing()"
          (click)="share(link)"
          aria-label="Partager ce wird"
          title="Partager ce wird"
          ><app-icon name="share" [size]="24"
        /></button>
      }
    </div>
    <h1>{{ title() }}</h1>
  </header>`,
  styles: `
    :host {
      display: block;
    }
    .wird-header__toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      min-height: 48px;
    }
    .wird-header__share {
      display: grid;
      place-items: center;
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      border-radius: 16px;
      background: var(--color-bg-muted);
      color: var(--color-primary);
      border: 0;
    }
    h1 {
      text-align: center;
      margin: 12px 0 16px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdHeader {
  private readonly router = inject(Router);
  readonly title = input.required<string>();
  readonly shareLink = input<string>();
  readonly shareUrl = input<string>();
  protected readonly sharing = signal(false);

  protected async share(fallback: string): Promise<void> {
    if (this.sharing()) return;
    const url = this.shareUrl();
    const data = { title: this.title(), url };
    if (!url || !isShareableAddress(url) || typeof navigator.share !== 'function' ||
      (navigator.canShare && !navigator.canShare(data))) {
      await this.router.navigateByUrl(fallback);
      return;
    }
    this.sharing.set(true);
    try {
      await navigator.share(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        await this.router.navigateByUrl(fallback);
    } finally {
      this.sharing.set(false);
    }
  }
}
