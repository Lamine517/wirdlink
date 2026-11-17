import { Translate } from '../../../../shared/pipes/translate';
import { BottomSheet } from '../../../../shared/components/bottom-sheet/bottom-sheet';
import { output } from '@angular/core';
import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { isShareableAddress } from '../../../../shared/components/desktop-companion/share-address';
import { BackButton } from '../../../../shared/components/back-button/back-button';
import { Icon } from '../../../../shared/components/icon/icon';

@Component({
  selector: 'app-wird-header',
  imports: [Translate, BackButton, Icon, BottomSheet],
  template: `<header>
      <div class="wird-header__toolbar">
        <app-back-button />
        @if (canManage() || allowDuplicate()) {
          <button
            type="button"
            class="icon-button wird-header__share"
            (click)="menu.open()"
            [attr.aria-label]="'Plus d’options' | t"
            [title]="'Plus d’options' | t"
          >
            <app-icon name="more" />
          </button>
        } @else {
          <button
            type="button"
            class="icon-button wird-header__share"
            [disabled]="sharing()"
            (click)="share(shareLink() ?? '')"
            [attr.aria-label]="'Partager' | t"
            [title]="'Partager' | t"
          >
            <app-icon name="share" />
          </button>
        }
      </div>
      <h1>{{ title() }}</h1>
    </header>
    <app-bottom-sheet #menu panelId="wird-options" [title]="'Ce wird' | t">
      <div class="wird-menu">
        @if (canManage()) {
          <button
            type="button"
            class="button button--outline"
            (click)="menu.close(); editRequested.emit()"
          >
            <app-icon name="edit" />{{ 'Modifier' | t }}
          </button>
        }
        <button
          type="button"
          class="button button--outline"
          [disabled]="sharing()"
          (click)="share(shareLink() ?? ''); menu.close()"
        >
          <app-icon name="share" />{{ 'Partager' | t }}
        </button>
        @if (allowDuplicate()) {
          <button
            type="button"
            class="button button--outline"
            (click)="menu.close(); duplicateRequested.emit()"
          >
            <app-icon name="copy" />{{ 'Dupliquer' | t }}
          </button>
        }
        @if (canManage()) {
          <button
            type="button"
            class="button button--danger"
            (click)="menu.close(); deleteRequested.emit()"
          >
            <app-icon name="trash" />{{ 'Supprimer' | t }}
          </button>
        }
      </div>
    </app-bottom-sheet>`,
  styles: `
    .wird-menu {
      display: grid;
      gap: 12px;
    }
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
    h1 {
      text-align: center;
      margin: var(--space-8) 0 var(--space-20);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WirdHeader {
  private readonly router = inject(Router);
  readonly allowDuplicate = input(false);
  readonly canManage = input(false);
  readonly editRequested = output<void>();
  readonly deleteRequested = output<void>();
  readonly duplicateRequested = output<void>();
  readonly title = input.required<string>();
  readonly shareLink = input<string>();
  readonly shareUrl = input<string>();
  protected readonly sharing = signal(false);

  protected async share(fallback: string): Promise<void> {
    if (this.sharing()) return;
    const url = this.shareUrl();
    const data = { title: this.title(), url };
    if (
      !url ||
      !isShareableAddress(url) ||
      typeof navigator.share !== 'function' ||
      (navigator.canShare && !navigator.canShare(data))
    ) {
      if (fallback) await this.router.navigateByUrl(fallback);
      return;
    }
    this.sharing.set(true);
    try {
      await navigator.share(data);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError'))
        if (fallback) await this.router.navigateByUrl(fallback);
    } finally {
      this.sharing.set(false);
    }
  }
}
